'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { LogOut } from 'lucide-react'

export default function KitchenPage() {
  return (
    <RoleGuard allowedRoles={['kitchen', 'admin']}>
      <KitchenDisplay />
    </RoleGuard>
  )
}

function KitchenDisplay() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.locationId) {
      loadOrders()
      const subscription = supabase
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadOrders()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.locationId])

  const loadOrders = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name)), tables(table_number), users(name)')
      .eq('location_id', user?.locationId)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true })

    setOrders(data || [])
    setIsLoading(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    loadOrders()
  }

  const getStatusColor = (status: string) => {
    if (status === 'pending') return 'bg-red-500'
    if (status === 'preparing') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getOrderAge = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    return minutes
  }

  const handleLogout = async () => {
    await useAuthStore.getState().signOut()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      {/* Header with Logout */}
      <div className="bg-white rounded-lg p-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Kitchen Display System</h1>
          <p className="text-gray-500 text-sm">{orders.length} active orders</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className={`bg-white rounded-lg p-4 border-l-4 ${getStatusColor(order.status)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xl font-bold">{order.order_number}</div>
                <div className="text-sm text-gray-600">Table {(order.tables as any)?.table_number || 'Takeout'}</div>
                <div className="text-sm text-gray-600">Waiter: {(order.users as any)?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#D4AF37]">{getOrderAge(order.created_at)}m</div>
                <div className="text-xs text-gray-500">ago</div>
              </div>
            </div>

            <div className="mb-4">
              {(order.order_items as any[]).map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <span className="font-semibold">{item.quantity}x {item.products.name}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600">
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600">
                  Mark Ready
                </button>
              )}
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🍳</div>
            <div className="text-xl">No active orders</div>
          </div>
        )}
      </div>
    </div>
  )
}
