import { supabase } from '@/lib/supabase'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Product {
  id: string
  locationId: string
  categoryId: string | null
  name: string
  description: string | null
  price: number
  cost: number
  sku: string | null
  barcode: string | null
  imageUrl: string | null
  isActive: boolean
  trackInventory: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  locationId: string
  name: 'Restaurant' | 'Bar' | 'Fumes'
  description: string | null
  color: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  locationId: string
  departmentId: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  modifiers: Array<{
    id: string
    name: string
    priceAdjustment: number
  }>
  notes?: string
}

export interface Order {
  id: string
  locationId: string
  tableId: string | null
  userId: string | null
  orderNumber: string
  status: 'draft' | 'submitted' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  orderType: 'dine_in' | 'takeout' | 'delivery'
  customerName: string | null
  customerPhone: string | null
  subtotal: number
  taxAmount: number
  tipAmount: number
  totalAmount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  items: CartItem[]
}

interface POSState {
  // Cart state
  cart: CartItem[]
  selectedTable: string | null
  selectedDepartment: string | null
  selectedDepartmentName: string | null
  orderType: 'dine_in' | 'takeout' | 'delivery'
  
  // Products state
  products: Product[]
  departments: Department[]
  categories: Category[]
  selectedCategory: string | null
  
  // Orders state
  currentOrder: Order | null
  orders: Order[]
  
  // UI state
  isLoading: boolean
  
  // Cart actions
  addToCart: (product: Product, quantity?: number, modifiers?: any[]) => void
  removeFromCart: (itemId: string) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  
  // Order actions
  setSelectedTable: (tableId: string | null) => void
  setSelectedDepartment: (departmentId: string | null, departmentName?: string | null) => void
  setOrderType: (type: 'dine_in' | 'takeout' | 'delivery') => void
  submitOrder: () => Promise<{ success: boolean; order?: Order; error?: string }>
  
  // Data actions
  loadDepartments: (locationId: string) => Promise<void>
  loadProducts: (locationId: string, departmentId?: string) => Promise<void>
  loadCategories: (locationId: string, departmentId?: string) => Promise<void>
  setSelectedCategory: (categoryId: string | null) => void
  
  // Real-time subscriptions
  subscribeToOrders: (locationId: string) => () => void
}

export const usePOSStore = create<POSState>()(
  devtools(
    (set, get) => ({
      // Initial state
      cart: [],
      selectedTable: null,
      selectedDepartment: null,
      selectedDepartmentName: null,
      orderType: 'dine_in',
      products: [],
      departments: [],
      categories: [],
      selectedCategory: null,
      currentOrder: null,
      orders: [],
      isLoading: false,

      // Cart actions
      addToCart: (product, quantity = 1, modifiers = []) => {
        const { cart } = get()
        const existingItem = cart.find(item => 
          item.productId === product.id && 
          JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
        )

        const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0)
        const unitPrice = product.price + modifierPrice

        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.id === existingItem.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    totalPrice: (item.quantity + quantity) * unitPrice
                  }
                : item
            )
          })
        } else {
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random()}`,
            productId: product.id,
            product,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
            modifiers
          }
          set({ cart: [...cart, newItem] })
        }
      },

      removeFromCart: (itemId) => {
        const { cart } = get()
        set({ cart: cart.filter(item => item.id !== itemId) })
      },

      updateCartItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
          return
        }

        const { cart } = get()
        set({
          cart: cart.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  totalPrice: quantity * item.unitPrice
                }
              : item
          )
        })
      },

      clearCart: () => {
        set({ cart: [], selectedTable: null })
      },

      // Order actions
      setSelectedTable: (tableId) => {
        set({ selectedTable: tableId })
      },

      setSelectedDepartment: (departmentId, departmentName = null) => {
        set({ 
          selectedDepartment: departmentId, 
          selectedDepartmentName: departmentName,
          selectedCategory: null, // Reset category when department changes
          products: [] // Clear products when department changes
        })
      },

      setOrderType: (type) => {
        set({ orderType: type })
      },

      submitOrder: async () => {
        const { cart, selectedTable, orderType, selectedDepartment } = get()
        
        if (cart.length === 0) {
          return { success: false, error: 'Cart is empty' }
        }

        try {
          set({ isLoading: true })

          // Fetch current auth user to attach user_id and resolve location_id
          const { data: auth } = await supabase.auth.getUser()
          const supaUserId = auth?.user?.id || null

          let locationId: string | null = null
          if (supaUserId) {
            const { data: userRow } = await supabase
              .from('users')
              .select('location_id')
              .eq('id', supaUserId)
              .single()
            locationId = userRow?.location_id ?? null
          }

          // Generate a unique, human-friendly order number
          const ts = new Date()
          const y = ts.getFullYear()
          const m = String(ts.getMonth() + 1).padStart(2, '0')
          const d = String(ts.getDate()).padStart(2, '0')
          const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
          const orderNumber = `ORD-${y}${m}${d}-${rand}`

          const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
          const totalAmount = subtotal

          // Create order with required columns per schema
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              location_id: locationId,
              department_id: selectedDepartment,
              table_id: selectedTable,
              user_id: supaUserId,
              order_number: orderNumber,
              order_type: orderType,
              subtotal,
              tax_amount: 0,
              tip_amount: 0,
              total_amount: totalAmount,
              status: 'submitted'
            })
            .select()
            .single()

          if (orderError) throw orderError

          // Create order items
          const orderItems = cart.map(item => ({
            order_id: orderData.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            notes: item.notes
          }))

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError

          // Clear cart and update state
          set({ cart: [], selectedTable: null, isLoading: false })

          return { success: true, order: orderData }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: (error as Error).message }
        }
      },

      // Data actions
      loadDepartments: async (locationId) => {
        try {
          const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('location_id', locationId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (error) throw error
          set({ departments: data || [] })
        } catch (error) {
          console.error('Error loading departments:', error)
        }
      },

      loadProducts: async (locationId, departmentId) => {
        if (!departmentId) return
        
        try {
          const { data, error } = await supabase
            .from('products')
            .select(`
              *,
              categories!inner(
                department_id
              )
            `)
            .eq('location_id', locationId)
            .eq('categories.department_id', departmentId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (error) throw error
          set({ products: data || [] })
        } catch (error) {
          console.error('Error loading products:', error)
        }
      },

      loadCategories: async (locationId, departmentId) => {
        if (!departmentId) return
        
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('location_id', locationId)
            .eq('department_id', departmentId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (error) throw error
          set({ categories: data || [] })
        } catch (error) {
          console.error('Error loading categories:', error)
        }
      },

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId })
      },

      // Real-time subscriptions
      subscribeToOrders: (locationId) => {
        const subscription = supabase
          .channel('orders')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `location_id=eq.${locationId}`
          }, (payload) => {
            const { orders } = get()
            
            if (payload.eventType === 'INSERT') {
              set({ orders: [...orders, payload.new as Order] })
            } else if (payload.eventType === 'UPDATE') {
              set({
                orders: orders.map(order =>
                  order.id === payload.new.id ? payload.new as Order : order
                )
              })
            } else if (payload.eventType === 'DELETE') {
              set({
                orders: orders.filter(order => order.id !== payload.old.id)
              })
            }
          })
          .subscribe()

        return () => {
          subscription.unsubscribe()
        }
      }
    }),
    { name: 'pos-store' }
  )
)
