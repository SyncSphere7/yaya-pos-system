'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tabs,
  Tab,
  TextField,
} from '@mui/material'
import {
  Receipt,
  Kitchen,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh as RefreshIcon,
  FilterList,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  customer_name: string | null
  total_amount: number
  status: string
  order_type: string
  created_at: string
  users?: { first_name: string; last_name: string }
  departments?: { name: string }
  tables?: { name: string }
}

interface OrderDetail extends Order {
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    products: { name: string }
  }>
}

export default function OrdersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <OrdersMonitoring />
    </RoleGuard>
  )
}

function OrdersMonitoring() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState(0)
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    if (user?.locationId) {
      loadOrders()

      // Subscribe to real-time updates
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `location_id=eq.${user.locationId}`
          },
          () => {
            loadOrders()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.locationId, dateFilter])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()

    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(now.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    return startDate.toISOString()
  }

  const loadOrders = async () => {
    if (!user?.locationId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users(first_name, last_name),
          departments(name),
          tables(name)
        `)
        .eq('location_id', user.locationId)
        .gte('created_at', getDateRange())
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrderDetails = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users(first_name, last_name),
          departments(name),
          tables(name),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            products(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setSelectedOrder(data as any)
      setDetailDialogOpen(true)
    } catch (err) {
      console.error('Error loading order details:', err)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
      if (selectedOrder?.id === orderId) {
        await loadOrderDetails(orderId)
      }
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'served': return 'info'
      case 'ready': return 'secondary'
      case 'preparing': return 'warning'
      case 'submitted': return 'primary'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getOrderTypeIcon = (type: string) => {
    return type === 'dine_in' ? '🍽️' : type === 'takeout' ? '📦' : '🚗'
  }

  const statusFilters = ['all', 'submitted', 'preparing', 'ready', 'served', 'paid', 'cancelled']
  const filteredOrders = orders.filter(order => {
    if (currentTab === 0) return true
    return order.status === statusFilters[currentTab]
  })

  const stats = {
    total: orders.length,
    submitted: orders.filter(o => o.status === 'submitted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
    paid: orders.filter(o => o.status === 'paid').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total_amount, 0)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage all orders in real-time
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateFilter}
              label="Date Range"
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadOrders}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Receipt color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Kitchen color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.preparing}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Kitchen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.paid}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {formatCurrency(stats.revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable">
          <Tab label={`All (${stats.total})`} />
          <Tab label={`New (${stats.submitted})`} />
          <Tab label={`Preparing (${stats.preparing})`} />
          <Tab label={`Ready (${stats.ready})`} />
          <Tab label={`Served (${stats.served})`} />
          <Tab label={`Paid (${stats.paid})`} />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order #</strong></TableCell>
                <TableCell><strong>Time</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Table</strong></TableCell>
                <TableCell><strong>Server</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.customer_name || 'Walk-in'}</TableCell>
                  <TableCell>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getOrderTypeIcon(order.order_type)}
                    </span>
                  </TableCell>
                  <TableCell>{(order.departments as any)?.name || '-'}</TableCell>
                  <TableCell>{(order.tables as any)?.name || '-'}</TableCell>
                  <TableCell>
                    {order.users ?
                      `${(order.users as any).first_name} ${(order.users as any).last_name}` :
                      '-'
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status) as any}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => loadOrderDetails(order.id)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Receipt sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - {selectedOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedOrder.customer_name || 'Walk-in'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Order Time</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Table</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {(selectedOrder.tables as any)?.name || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedOrder.status}
                      color={getStatusColor(selectedOrder.status) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" fontWeight={700} gutterBottom>
                Order Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{(item.products as any).name}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell align="right" fontWeight={600}>
                        {formatCurrency(item.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        {formatCurrency(selectedOrder.total_amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Update Status
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {['submitted', 'preparing', 'ready', 'served', 'paid'].map(status => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {status}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

