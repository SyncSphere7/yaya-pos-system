/**
 * Initiate Payment API
 * Handles: Cash, Airtel Money, MTN MoMo, Card (POS Terminal)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  initiateMobileMoneyPayment,
  formatUgandaPhone,
  validatePaymentMethod,
} from '@/lib/pesapal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      amount,
      paymentMethod,
      phoneNumber,
      processedBy,
      locationId,
    } = body

    // Validate required fields
    if (!orderId || !amount || !paymentMethod || !processedBy || !locationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const merchantReference = `ORD-${Date.now()}-${orderId.substring(0, 8)}`

    // Handle different payment methods
    if (paymentMethod === 'cash') {
      // Cash payment - immediate confirmation
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          method: 'cash',
          status: 'completed',
          payment_date: new Date().toISOString(),
          confirmation_code: `CASH-${Date.now()}`,
          reference_number: merchantReference,
          processed_by: processedBy,
          location_id: locationId,
          currency: 'UGX',
          payment_description: 'Cash payment',
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Cash payment error:', paymentError)
        return NextResponse.json(
          { error: 'Failed to process cash payment' },
          { status: 500 }
        )
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
        })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        method: 'cash',
        status: 'completed',
        message: 'Cash payment recorded successfully',
      })
    } else if (paymentMethod === 'airtel_money' || paymentMethod === 'mtn_momo') {
      // Mobile money payment - requires phone number
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number required for mobile money payment' },
          { status: 400 }
        )
      }

      // Format and validate phone number
      let formattedPhone: string
      try {
        formattedPhone = formatUgandaPhone(phoneNumber)
        
        // Validate that phone matches payment method
        if (!validatePaymentMethod(formattedPhone, paymentMethod)) {
          const expectedProvider = paymentMethod === 'airtel_money' ? 'Airtel (070x, 075x)' : 'MTN (077x, 078x, 076x)'
          return NextResponse.json(
            { 
              error: `Invalid phone number for ${paymentMethod}. Expected ${expectedProvider}` 
            },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      // Create pending payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          method: paymentMethod,
          status: 'pending',
          phone_number: formattedPhone,
          reference_number: merchantReference,
          processed_by: processedBy,
          location_id: locationId,
          currency: 'UGX',
          payment_description: `${paymentMethod === 'airtel_money' ? 'Airtel Money' : 'MTN Mobile Money'} payment`,
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Payment record error:', paymentError)
        return NextResponse.json(
          { error: 'Failed to create payment record' },
          { status: 500 }
        )
      }

      // Update order status to pending payment
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
        })
        .eq('id', orderId)

      // Initiate Pesapal payment (STK Push)
      try {
        const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yaya-pos-system.vercel.app'}/payment/callback`
        const notificationId = process.env.PESAPAL_IPN_ID || ''

        const pesapalResponse = await initiateMobileMoneyPayment({
          orderId: merchantReference,
          amount,
          phoneNumber: formattedPhone,
          paymentMethod,
          description: `${order.order_number} - Table ${order.table_id || 'Takeout'}`,
          callbackUrl,
          notificationId,
        })

        // Update payment with Pesapal tracking ID
        await supabase
          .from('payments')
          .update({
            transaction_id: pesapalResponse.order_tracking_id,
            pesapal_tracking_id: pesapalResponse.order_tracking_id,
          })
          .eq('id', payment.id)

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          method: paymentMethod,
          status: 'pending',
          trackingId: pesapalResponse.order_tracking_id,
          message: `Payment request sent to ${formattedPhone}. Customer should enter PIN on their phone.`,
        })
      } catch (error) {
        console.error('Pesapal error:', error)
        
        // Mark payment as failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment.id)

        return NextResponse.json(
          { error: 'Failed to initiate mobile money payment' },
          { status: 500 }
        )
      }
    } else if (paymentMethod === 'card_pos') {
      // Card payment via POS terminal - mark as pending until webhook confirms
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          method: 'card_pos',
          status: 'pending',
          reference_number: merchantReference,
          processed_by: processedBy,
          location_id: locationId,
          currency: 'UGX',
          payment_description: 'Card payment via POS terminal',
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Card payment error:', paymentError)
        return NextResponse.json(
          { error: 'Failed to initiate card payment' },
          { status: 500 }
        )
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
        })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        method: 'card_pos',
        status: 'pending',
        message: 'Please swipe card on POS terminal. Waiting for confirmation...',
      })
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
