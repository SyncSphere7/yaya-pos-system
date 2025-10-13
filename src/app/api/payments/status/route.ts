/**
 * Check Payment Status API
 * Checks both database and Pesapal for payment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkPaymentStatus } from '@/lib/pesapal'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      )
    }

    // Get payment from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment has Pesapal tracking ID and is still pending, check Pesapal
    if (payment.pesapal_tracking_id && payment.status === 'pending') {
      try {
        const pesapalStatus = await checkPaymentStatus(payment.pesapal_tracking_id)
        
        const isCompleted = pesapalStatus.payment_status_code === '1' || 
                           pesapalStatus.payment_status_description.toLowerCase() === 'completed'

        // Update local database if status changed
        if (isCompleted && payment.status !== 'completed') {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              payment_date: new Date().toISOString(),
              confirmation_code: pesapalStatus.confirmation_code,
            })
            .eq('id', paymentId)

          // Update order status
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
            })
            .eq('id', payment.order_id)

          return NextResponse.json({
            paymentId: payment.id,
            status: 'completed',
            method: payment.method,
            amount: payment.amount,
            confirmationCode: pesapalStatus.confirmation_code,
            updatedAt: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          paymentId: payment.id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          pesapalStatus: pesapalStatus.payment_status_description,
        })
      } catch (error) {
        console.error('Pesapal status check error:', error)
        // Return local status if Pesapal check fails
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      confirmationCode: payment.confirmation_code,
      paymentDate: payment.payment_date,
      phoneNumber: payment.phone_number,
    })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
