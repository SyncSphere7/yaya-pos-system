import { NextRequest, NextResponse } from 'next/server'
import { getPaymentService } from '@/lib/payments/payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentService = getPaymentService()
    
    const result = await paymentService.initiatePayment(body)
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get('trackingId')
    
    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      )
    }
    
    const paymentService = getPaymentService()
    const result = await paymentService.checkPaymentStatus(trackingId)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
