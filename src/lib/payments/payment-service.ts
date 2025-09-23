import { supabase } from '@/lib/supabase'
import { getPesapalInstance, PaymentRequest, PaymentMethod, PAYMENT_METHODS } from './pesapal'
import { v4 as uuidv4 } from 'uuid'

export interface PaymentInitiationRequest {
  orderId: string
  amount: number
  currency: 'UGX' | 'USD' | 'KES'
  method: PaymentMethod
  customerInfo: {
    email: string
    phone?: string
    firstName: string
    lastName: string
  }
  callbackUrl: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  redirectUrl?: string
  trackingId?: string
  error?: string
}

export class PaymentService {
  private pesapal = getPesapalInstance()

  async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentResult> {
    try {
      // Create payment record in database
      const paymentId = uuidv4()
      
      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          id: paymentId,
          order_id: request.orderId,
          amount: request.amount,
          method: request.method,
          status: 'pending',
          metadata: {
            currency: request.currency,
            customer_info: request.customerInfo,
            initiated_at: new Date().toISOString()
          }
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Handle different payment methods
      switch (request.method) {
        case PAYMENT_METHODS.CASH:
          return await this.handleCashPayment(paymentId, request)
        
        case PAYMENT_METHODS.MTN_MOMO:
        case PAYMENT_METHODS.AIRTEL_PAY:
        case PAYMENT_METHODS.CARD:
        case PAYMENT_METHODS.PESAPAL:
          return await this.handleDigitalPayment(paymentId, request)
        
        default:
          throw new Error(`Unsupported payment method: ${request.method}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      }
    }
  }

  private async handleCashPayment(paymentId: string, request: PaymentInitiationRequest): Promise<PaymentResult> {
    // For cash payments, we immediately mark as completed
    // In a real scenario, this would be confirmed by the cashier
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        transaction_id: `CASH_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      throw new Error(`Failed to update cash payment: ${error.message}`)
    }

    return {
      success: true,
      paymentId,
      trackingId: `CASH_${Date.now()}`
    }
  }

  private async handleDigitalPayment(paymentId: string, request: PaymentInitiationRequest): Promise<PaymentResult> {
    try {
      const pesapalRequest: PaymentRequest = {
        id: paymentId,
        currency: request.currency,
        amount: request.amount,
        description: `Order payment for ${request.orderId}`,
        callback_url: request.callbackUrl,
        billing_address: {
          email_address: request.customerInfo.email,
          phone_number: request.customerInfo.phone,
          country_code: request.currency === 'UGX' ? 'UG' : request.currency === 'KES' ? 'KE' : 'US',
          first_name: request.customerInfo.firstName,
          last_name: request.customerInfo.lastName,
          line_1: 'N/A',
          city: 'Kampala',
          state: 'Central',
          postal_code: '00000'
        }
      }

      const response = await this.pesapal.submitOrderRequest(pesapalRequest)

      // Update payment record with Pesapal tracking ID
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          pesapal_tracking_id: response.order_tracking_id,
          transaction_id: response.merchant_reference,
          status: 'processing',
          metadata: {
            ...request,
            pesapal_response: response,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', paymentId)

      if (updateError) {
        throw new Error(`Failed to update payment record: ${updateError.message}`)
      }

      return {
        success: true,
        paymentId,
        redirectUrl: response.redirect_url,
        trackingId: response.order_tracking_id
      }
    } catch (error) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', paymentId)

      throw error
    }
  }

  async checkPaymentStatus(trackingId: string): Promise<{ status: string; details?: any }> {
    try {
      // First check our local database
      const { data: paymentData, error: dbError } = await supabase
        .from('payments')
        .select('*')
        .eq('pesapal_tracking_id', trackingId)
        .single()

      if (dbError || !paymentData) {
        throw new Error('Payment record not found')
      }

      // If payment is already completed or failed, return local status
      if (paymentData.status === 'completed' || paymentData.status === 'failed') {
        return {
          status: paymentData.status,
          details: paymentData
        }
      }

      // For processing payments, check with Pesapal
      if (paymentData.method !== PAYMENT_METHODS.CASH) {
        const pesapalStatus = await this.pesapal.getTransactionStatus(trackingId)
        
        // Update local payment status based on Pesapal response
        let newStatus = 'processing'
        
        if (this.pesapal.isPaymentSuccessful(pesapalStatus)) {
          newStatus = 'completed'
        } else if (this.pesapal.isPaymentFailed(pesapalStatus)) {
          newStatus = 'failed'
        }

        if (newStatus !== paymentData.status) {
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              status: newStatus,
              metadata: {
                ...paymentData.metadata,
                pesapal_status: pesapalStatus,
                status_updated_at: new Date().toISOString()
              }
            })
            .eq('pesapal_tracking_id', trackingId)

          if (updateError) {
            console.error('Failed to update payment status:', updateError)
          }
        }

        return {
          status: newStatus,
          details: { ...paymentData, pesapal_status: pesapalStatus }
        }
      }

      return {
        status: paymentData.status,
        details: paymentData
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async processRefund(paymentId: string, amount?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: paymentData, error: dbError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (dbError || !paymentData) {
        throw new Error('Payment record not found')
      }

      if (paymentData.status !== 'completed') {
        throw new Error('Can only refund completed payments')
      }

      const refundAmount = amount || paymentData.amount

      // For cash payments, just update the record
      if (paymentData.method === PAYMENT_METHODS.CASH) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'refunded',
            metadata: {
              ...paymentData.metadata,
              refund_amount: refundAmount,
              refunded_at: new Date().toISOString(),
              refund_method: 'cash'
            }
          })
          .eq('id', paymentId)

        if (updateError) {
          throw new Error(`Failed to process cash refund: ${updateError.message}`)
        }

        return { success: true }
      }

      // For digital payments, this would typically involve calling Pesapal's refund API
      // Since Pesapal doesn't have a direct refund API, we mark it for manual processing
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          metadata: {
            ...paymentData.metadata,
            refund_amount: refundAmount,
            refund_requested_at: new Date().toISOString(),
            refund_method: 'manual_processing_required'
          }
        })
        .eq('id', paymentId)

      if (updateError) {
        throw new Error(`Failed to process refund: ${updateError.message}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      }
    }
  }

  // Webhook handler for Pesapal IPN notifications
  async handleIPNNotification(notification: any): Promise<void> {
    try {
      const { OrderTrackingId, OrderMerchantReference } = notification

      if (OrderTrackingId) {
        // Check payment status and update local record
        await this.checkPaymentStatus(OrderTrackingId)
      }
    } catch (error) {
      console.error('Error handling IPN notification:', error)
    }
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService()
  }
  return paymentServiceInstance
}
