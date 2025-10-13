/**
 * Pesapal IPN (Instant Payment Notification) Webhook
 * Receives real-time payment confirmations from Pesapal
 * Updates order and payment status in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkPaymentStatus } from '@/lib/pesapal'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const merchantReference = searchParams.get('OrderMerchantReference')

    if (!orderTrackingId || !merchantReference) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('📥 Pesapal webhook received:', {
      orderTrackingId,
      merchantReference,
      timestamp: new Date().toISOString(),
    })

    // Get payment status from Pesapal
    const paymentStatus = await checkPaymentStatus(orderTrackingId)

    console.log('💳 Payment status from Pesapal:', paymentStatus)

    // Determine if payment is successful
    const isSuccessful = paymentStatus.payment_status_code === '1' || 
                         paymentStatus.payment_status_description.toLowerCase() === 'completed'

    // Update payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: isSuccessful ? 'completed' : 'failed',
        payment_date: new Date().toISOString(),
        confirmation_code: paymentStatus.confirmation_code,
        transaction_id: orderTrackingId,
        pesapal_tracking_id: orderTrackingId,
        metadata: {
          payment_method: paymentStatus.payment_method,
          payment_account: paymentStatus.payment_account,
          status_code: paymentStatus.status_code,
          payment_status_code: paymentStatus.payment_status_code,
          payment_status_description: paymentStatus.payment_status_description,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('reference_number', merchantReference)
      .select('id, order_id')
      .single()

    if (paymentError) {
      console.error('❌ Failed to update payment:', paymentError)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    // Update order payment status
    if (isSuccessful && payment?.order_id) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed', // Move order to confirmed status
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.order_id)

      if (orderError) {
        console.error('❌ Failed to update order:', orderError)
      } else {
        console.log('✅ Order payment status updated to paid')
      }
    }

    console.log('✅ Payment webhook processed successfully')

    return NextResponse.json({
      success: true,
      message: 'Payment notification processed',
      status: isSuccessful ? 'completed' : 'failed',
    })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Pesapal uses GET method for IPN
export async function POST(request: NextRequest) {
  return GET(request)
}
