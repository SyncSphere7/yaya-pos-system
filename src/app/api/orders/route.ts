import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      locationId, 
      tableId, 
      userId, 
      orderType, 
      customerName, 
      customerPhone, 
      items, 
      notes 
    } = body

    if (!locationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    )
    const totalAmount = subtotal
    const orderNumber = generateOrderNumber()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        location_id: locationId,
        table_id: tableId,
        user_id: userId,
        order_number: orderNumber,
        status: 'submitted',
        order_type: orderType || 'dine_in',
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal,
        tax_amount: 0,
        total_amount: totalAmount,
        notes
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      notes: item.notes
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    if (orderType === 'dine_in' && tableId) {
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', tableId)
    }

    return NextResponse.json({ 
      success: true, 
      order: { ...order, items: orderItems }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        tables(name),
        users(first_name, last_name),
        order_items(
          *,
          products(name, price)
        )
      `)
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}