import { NextRequest, NextResponse } from 'next/server'
import { getPaymentService } from '@/lib/payments/payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentService = getPaymentService()
    
    // Handle Pesapal IPN notification
    await paymentService.handleIPNNotification(body)
    
    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (error) {
    console.error('IPN processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
