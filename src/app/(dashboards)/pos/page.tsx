'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

export default function POSPage() {
  return (
    <RoleGuard allowedRoles={['waiter', 'cashier', 'manager', 'admin']}>
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

  useEffect(() => {
    if (user?.locationId) {
      loadData()
    }
  }, [user?.locationId, selectedCategory])

  const loadData = async () => {
    setIsLoading(true)
    const [productsRes, categoriesRes, tablesRes] = await Promise.all([
      supabase.from('products').select('*').eq('location_id', user?.locationId).eq('is_active', true),
      supabase.from('categories').select('*'),
      supabase.from('tables').select('*').eq('location_id', user?.locationId).eq('status', 'available')
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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    const orderNumber = `ORD-${Date.now()}`
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      order_number: orderNumber,
      location_id: user?.locationId,
      user_id: user?.id,
      table_id: selectedTable || null,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      status: 'pending'
    }).select().single()

    if (orderError) {
      alert('Error creating order: ' + orderError.message)
      return
    }

    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      alert('Error adding items: ' + itemsError.message)
      return
    }

    if (selectedTable) {
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable)
    }

    alert(`Order ${orderNumber} created successfully!`)
    setCart([])
    setSelectedTable('')
    setIncludeTax(false)
    loadData()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
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

          <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold hover:bg-[#c4a137] disabled:opacity-50">
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}
