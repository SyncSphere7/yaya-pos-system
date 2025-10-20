'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Smartphone, DollarSign, CheckCircle, AlertCircle, Phone, Clock, Wifi, LogOut } from 'lucide-react'

export default function POSPage() {
  return (
    <RoleGuard allowedRoles={['waiter', 'cashier', 'admin']}>
      <POSDashboard />
    </RoleGuard>
  )
}

function POSDashboard() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tables, setTables] = useState<any[]>([])
  const [includeTax, setIncludeTax] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'airtel_money' | 'mtn_momo' | 'card_pos'>('cash')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    if (user?.location_id) {
      loadData()
    }
  }, [user?.location_id, selectedCategory])

  const loadData = async () => {
    setIsLoading(true)
    const [productsRes, categoriesRes, tablesRes] = await Promise.all([
      supabase.from('products').select('*').eq('location_id', user?.location_id).eq('is_active', true),
      supabase.from('categories').select('*'),
      supabase.from('tables').select('*').eq('location_id', user?.location_id).eq('status', 'available')
    ])
    
    setProducts(productsRes.data || [])
    setCategories(categoriesRes.data || [])
    setTables(tablesRes.data || [])
    setIsLoading(false)
  }

  const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category_id === selectedCategory)

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== productId))
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity } : item))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxAmount = includeTax ? subtotal * 0.18 : 0
  const total = subtotal + taxAmount

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')

    try {
      // Create order first
      const orderNumber = `ORD-${Date.now()}`
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        location_id: user?.location_id,
        user_id: user?.id,
        table_id: selectedTable || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        status: 'pending'
      }).select().single()

      if (orderError) {
        throw new Error('Failed to create order: ' + orderError.message)
      }

      // Add order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        throw new Error('Failed to add order items: ' + itemsError.message)
      }

      // Update table status if table selected
      if (selectedTable) {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable)
      }

      // Process payment based on method
      if (paymentMethod === 'cash') {
        // Cash payment - immediate confirmation
        const { error: paymentError } = await supabase.from('payments').insert({
          order_id: order.id,
          amount: total,
          method: 'cash',
          status: 'completed',
          payment_date: new Date().toISOString(),
          confirmation_code: `CASH-${Date.now()}`,
          reference_number: `CASH-${order.id}`,
          processed_by: user?.id,
          location_id: user?.location_id,
          currency: 'UGX',
          payment_description: 'Cash payment'
        })

        if (paymentError) {
          throw new Error('Failed to record cash payment')
        }

        // Update order status
        await supabase.from('orders').update({
          payment_status: 'paid',
          status: 'confirmed'
        }).eq('id', order.id)

        setPaymentStatus('success')
        setPaymentMessage('Cash payment recorded successfully!')

      } else if (paymentMethod === 'airtel_money' || paymentMethod === 'mtn_momo') {
        // Mobile money payment
        if (!phoneNumber) {
          throw new Error('Phone number required for mobile money payment')
        }

        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: total,
            paymentMethod,
            phoneNumber,
            processedBy: user?.id,
            locationId: user?.location_id
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Payment initiation failed')
        }

        setPaymentStatus('processing')
        setPaymentMessage(`Payment request sent to ${phoneNumber}. Waiting for customer confirmation...`)

        // Start polling for payment status
        pollPaymentStatus(result.paymentId, order.id)

      } else if (paymentMethod === 'card_pos') {
        // Card payment via POS terminal
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: total,
            paymentMethod: 'card_pos',
            processedBy: user?.id,
            locationId: user?.location_id
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Card payment initiation failed')
        }

        setPaymentStatus('processing')
        setPaymentMessage('Please swipe card on POS terminal. Waiting for confirmation...')

        // Start polling for payment status
        pollPaymentStatus(result.paymentId, order.id)
      }

    } catch (error: any) {
      setPaymentStatus('error')
      setPaymentMessage(error.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    await useAuthStore.getState().signOut()
  }

  const pollPaymentStatus = async (paymentId: string, orderId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes max

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
        const result = await response.json()

        if (result.status === 'completed') {
          setPaymentStatus('success')
          setPaymentMessage(`Payment received! ${result.confirmationCode || ''}`)
          return
        } else if (result.status === 'failed') {
          setPaymentStatus('error')
          setPaymentMessage('Payment failed. Please try again.')
          return
        }

        // Continue polling if still pending
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000) // Check every 2 seconds
        } else {
          setPaymentStatus('error')
          setPaymentMessage('Payment timeout. Please check manually.')
        }
      } catch (error) {
        setPaymentStatus('error')
        setPaymentMessage('Failed to check payment status')
      }
    }

    checkStatus()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      {/* Header with Logout */}
      <div className="bg-white rounded-lg p-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Point of Sale</h1>
          <p className="text-gray-500 text-sm">{user?.firstName} {user?.lastName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[#D4AF37] text-black' : 'bg-gray-200'}`}>All</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${selectedCategory === cat.id ? 'bg-[#D4AF37] text-black' : 'bg-gray-200'}`}>{cat.name}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button key={product.id} onClick={() => addToCart(product)} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 text-left">
                  <div className="font-bold mb-1">{product.name}</div>
                  <div className="text-[#D4AF37] font-semibold">{formatCurrency(product.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-96 bg-white rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Current Order</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Table</label>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Takeout</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>Table {table.table_number}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between mb-3 pb-3 border-b">
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-gray-200 rounded">-</button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-gray-200 rounded">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium">Include Tax (18%)</span>
            </label>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {includeTax && (
              <div className="flex justify-between">
                <span>Tax (18%):</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-[#D4AF37]">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold hover:bg-[#c4a137] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Process Payment ({formatCurrency(total)})
          </button>
        </div>
      </div>
    </div>
  )

  // Payment Modal
  if (showPaymentModal) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Process Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentStatus('idle')
                  setPaymentMessage('')
                  setPhoneNumber('')
                }}
                className="text-gray-400 hover:text-[#1a1a1a]"
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="text-sm space-y-1">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                {includeTax && (
                  <div className="flex justify-between text-sm">
                    <span>Tax (18%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {paymentStatus !== 'idle' && (
              <div className={`mb-6 p-4 rounded-lg ${
                paymentStatus === 'success' ? 'bg-green-50 border border-green-200' :
                paymentStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  {paymentStatus === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : paymentStatus === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      paymentStatus === 'success' ? 'text-green-800' :
                      paymentStatus === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {paymentStatus === 'success' ? 'Payment Successful!' :
                       paymentStatus === 'error' ? 'Payment Failed' :
                       'Processing Payment...'}
                    </p>
                    <p className={`text-sm ${
                      paymentStatus === 'success' ? 'text-green-600' :
                      paymentStatus === 'error' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {paymentMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {paymentStatus === 'idle' && (
              <>
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      paymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Cash Payment</div>
                      <div className="text-sm opacity-75">Manual confirmation</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('airtel_money')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      paymentMethod === 'airtel_money'
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Airtel Money</div>
                      <div className="text-sm opacity-75">STK Push to customer phone</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      paymentMethod === 'mtn_momo'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">MTN Mobile Money</div>
                      <div className="text-sm opacity-75">STK Push to customer phone</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card_pos')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      paymentMethod === 'card_pos'
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Card (POS Terminal)</div>
                      <div className="text-sm opacity-75">External Pesapal terminal</div>
                    </div>
                  </button>
                </div>

                {/* Phone Number Input for Mobile Money */}
                {(paymentMethod === 'airtel_money' || paymentMethod === 'mtn_momo') && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0751234567"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentMethod === 'airtel_money'
                        ? 'Airtel numbers start with 070, 075'
                        : 'MTN numbers start with 077, 078, 076'}
                    </p>
                  </div>
                )}

                {/* Payment Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentStatus('idle')
                      setPaymentMessage('')
                      setPhoneNumber('')
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || (['airtel_money', 'mtn_momo'].includes(paymentMethod) && !phoneNumber)}
                    className="flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-lg font-semibold hover:bg-[#c4a137] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Process Payment
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Success/Error Actions */}
            {paymentStatus !== 'idle' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentStatus('idle')
                    setPaymentMessage('')
                    setPhoneNumber('')
                    setCart([])
                    setSelectedTable('')
                    setIncludeTax(false)
                    loadData()
                  }}
                  className="flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-lg font-semibold hover:bg-[#c4a137] transition-colors"
                >
                  {paymentStatus === 'success' ? 'Done' : 'Try Again'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}
