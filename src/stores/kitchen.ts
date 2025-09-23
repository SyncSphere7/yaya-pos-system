import { supabase } from '@/lib/supabase'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Table {
  id: string
  locationId: string
  name: string
  capacity: number
  section: string | null
  status: 'available' | 'occupied' | 'cleaning' | 'reserved'
  createdAt: string
  updatedAt: string
}

export interface KitchenOrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  notes: string | null
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface KitchenOrder {
  id: string
  orderNumber: string
  tableId: string | null
  tableName: string | null
  status: 'submitted' | 'preparing' | 'ready' | 'served'
  orderType: 'dine_in' | 'takeout' | 'delivery'
  customerName: string | null
  items: KitchenOrderItem[]
  createdAt: string
  updatedAt: string
  preparationTime?: number // in minutes
}

interface KitchenState {
  // Tables state
  tables: Table[]
  
  // Orders state
  orders: KitchenOrder[]
  selectedOrder: KitchenOrder | null
  
  // UI state
  isLoading: boolean
  
  // Actions
  loadTables: (locationId: string) => Promise<void>
  loadOrders: (locationId: string) => Promise<void>
  updateTableStatus: (tableId: string, status: Table['status']) => Promise<void>
  updateOrderStatus: (orderId: string, status: KitchenOrder['status']) => Promise<void>
  updateOrderItemStatus: (itemId: string, status: KitchenOrderItem['status']) => Promise<void>
  setSelectedOrder: (order: KitchenOrder | null) => void
  
  // Real-time subscriptions
  subscribeToKitchen: (locationId: string) => () => void
}

export const useKitchenStore = create<KitchenState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tables: [],
      orders: [],
      selectedOrder: null,
      isLoading: false,

      // Actions
      loadTables: async (locationId) => {
        try {
          set({ isLoading: true })
          
          const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('location_id', locationId)
            .order('name', { ascending: true })

          if (error) throw error
          
          set({ tables: data || [], isLoading: false })
        } catch (error) {
          console.error('Error loading tables:', error)
          set({ isLoading: false })
        }
      },

      loadOrders: async (locationId) => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              tables(name),
              order_items(
                *,
                products(name)
              )
            `)
            .eq('location_id', locationId)
            .in('status', ['submitted', 'preparing', 'ready'])
            .order('created_at', { ascending: true })

          if (error) throw error

          const kitchenOrders: KitchenOrder[] = (data || []).map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            tableId: order.table_id,
            tableName: order.tables?.name || null,
            status: order.status,
            orderType: order.order_type,
            customerName: order.customer_name,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            items: order.order_items.map((item: any) => ({
              id: item.id,
              orderId: item.order_id,
              productId: item.product_id,
              productName: item.products.name,
              quantity: item.quantity,
              notes: item.notes,
              status: item.status,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            }))
          }))

          set({ orders: kitchenOrders })
        } catch (error) {
          console.error('Error loading orders:', error)
        }
      },

      updateTableStatus: async (tableId, status) => {
        try {
          const { error } = await supabase
            .from('tables')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', tableId)

          if (error) throw error

          // Update local state
          const { tables } = get()
          set({
            tables: tables.map(table =>
              table.id === tableId
                ? { ...table, status, updatedAt: new Date().toISOString() }
                : table
            )
          })
        } catch (error) {
          console.error('Error updating table status:', error)
        }
      },

      updateOrderStatus: async (orderId, status) => {
        try {
          const { error } = await supabase
            .from('orders')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

          if (error) throw error

          // Update local state
          const { orders } = get()
          set({
            orders: orders.map(order =>
              order.id === orderId
                ? { ...order, status, updatedAt: new Date().toISOString() }
                : order
            )
          })

          // If order is ready/served, update table status
          if (status === 'ready' || status === 'served') {
            const order = orders.find(o => o.id === orderId)
            if (order?.tableId) {
              get().updateTableStatus(order.tableId, status === 'served' ? 'cleaning' : 'occupied')
            }
          }
        } catch (error) {
          console.error('Error updating order status:', error)
        }
      },

      updateOrderItemStatus: async (itemId, status) => {
        try {
          const { error } = await supabase
            .from('order_items')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', itemId)

          if (error) throw error

          // Update local state
          const { orders } = get()
          set({
            orders: orders.map(order => ({
              ...order,
              items: order.items.map(item =>
                item.id === itemId
                  ? { ...item, status, updatedAt: new Date().toISOString() }
                  : item
              )
            }))
          })
        } catch (error) {
          console.error('Error updating order item status:', error)
        }
      },

      setSelectedOrder: (order) => {
        set({ selectedOrder: order })
      },

      // Real-time subscriptions
      subscribeToKitchen: (locationId) => {
        const ordersSubscription = supabase
          .channel('kitchen-orders')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `location_id=eq.${locationId}`
          }, () => {
            // Reload orders when changes occur
            get().loadOrders(locationId)
          })
          .subscribe()

        const tablesSubscription = supabase
          .channel('kitchen-tables')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tables',
            filter: `location_id=eq.${locationId}`
          }, (payload) => {
            const { tables } = get()
            
            if (payload.eventType === 'UPDATE') {
              set({
                tables: tables.map(table =>
                  table.id === payload.new.id ? payload.new as Table : table
                )
              })
            }
          })
          .subscribe()

        return () => {
          ordersSubscription.unsubscribe()
          tablesSubscription.unsubscribe()
        }
      }
    }),
    { name: 'kitchen-store' }
  )
)
