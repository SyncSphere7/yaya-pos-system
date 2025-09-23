'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useKitchenStore } from '@/stores/kitchen'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { 
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material'
import {
  RestaurantMenu as MenuIcon,
  Kitchen as KitchenIcon,
  CheckCircle as CheckCircleIcon,
  TableRestaurant as TableIcon,
  Timer as TimerIcon,
  PlayArrow as StartIcon,
  Done as DoneIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { formatDate } from '@/lib/utils'

export default function KitchenPage() {
  return (
    <RoleGuard allowedRoles={['kitchen', 'manager', 'admin']}>
      <KitchenDisplaySystem />
    </RoleGuard>
  )
}

function KitchenDisplaySystem() {
  const { user } = useAuthStore()
  const {
    orders,
    tables,
    selectedOrder,
    isLoading,
    loadOrders,
    loadTables,
    updateOrderStatus,
    updateOrderItemStatus,
    setSelectedOrder,
    subscribeToKitchen
  } = useKitchenStore()

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (user?.locationId) {
      loadOrders(user.locationId)
      loadTables(user.locationId)
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToKitchen(user.locationId)
      return unsubscribe
    }
  }, [user?.locationId, loadOrders, loadTables, subscribeToKitchen])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getOrderStatusColor = (status: string, createdAt: string) => {
    const minutesOld = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000)
    
    switch (status) {
      case 'submitted':
        return minutesOld > 15 ? 'error' : minutesOld > 10 ? 'warning' : 'info'
      case 'preparing':
        return minutesOld > 25 ? 'error' : minutesOld > 20 ? 'warning' : 'success'
      case 'ready':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTimeElapsed = (createdAt: string) => {
    const minutes = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000)
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const handleOrderAction = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus as any)
  }

  const handleItemAction = async (itemId: string, newStatus: string) => {
    await updateOrderItemStatus(itemId, newStatus as any)
  }

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'white' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'grey.800' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'orange.main' }}>
              <KitchenIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Kitchen Display System
              </Typography>
              <Typography variant="body2" color="grey.400">
                Real-time order management
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={3}>
            <Box textAlign="right">
              <Typography variant="h6" fontWeight={600}>
                {currentTime.toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="grey.400">
                {currentTime.toLocaleDateString()}
              </Typography>
            </Box>
            
            <Paper sx={{ p: 2, bgcolor: 'grey.700', color: 'white' }}>
              <Typography variant="caption" color="grey.400">
                Active Orders
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {orders.length}
              </Typography>
            </Paper>

            <IconButton 
              color="inherit" 
              onClick={() => user?.locationId && loadOrders(user.locationId)}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Orders Grid */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {orders.map((order) => {
            const table = tables.find(t => t.id === order.tableId)
            const statusColor = getOrderStatusColor(order.status, order.createdAt)
            const timeElapsed = getTimeElapsed(order.createdAt)
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                <Card 
                  sx={{ 
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: statusColor === 'error' ? 'error.main' : 
                                statusColor === 'warning' ? 'warning.main' : 
                                statusColor === 'success' ? 'success.main' : 
                                'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    }
                  }}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Header */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: statusColor === 'error' ? 'error.main' : 
                              statusColor === 'warning' ? 'warning.main' : 
                              statusColor === 'success' ? 'success.main' :
                              statusColor === 'secondary' ? 'secondary.main' :
                              'primary.main',
                      color: 'white'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight={600}>
                        Order #{order.orderNumber}
                      </Typography>
                      <Chip 
                        icon={<TimerIcon />}
                        label={timeElapsed}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      {table && (
                        <>
                          <TableIcon fontSize="small" />
                          <Typography variant="body2">
                            Table {table.number}
                          </Typography>
                        </>
                      )}
                      <Typography variant="body2" sx={{ ml: 'auto' }}>
                        {order.orderType.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Order Items */}
                  <CardContent sx={{ p: 0 }}>
                    <List sx={{ py: 0 }}>
                      {order.items.map((item, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            py: 1.5, 
                            px: 2,
                            borderBottom: index < order.items.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontWeight={500}>
                                  {item.quantity}x {item.productName}
                                </Typography>
                                <Chip
                                  label={item.status}
                                  size="small"
                                  color={
                                    item.status === 'pending' ? 'default' :
                                    item.status === 'preparing' ? 'warning' :
                                    item.status === 'ready' ? 'success' : 'default'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              item.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Note: {item.notes}
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    {order.status === 'submitted' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<StartIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOrderAction(order.id, 'preparing')
                        }}
                      >
                        Start Cooking
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        startIcon={<DoneIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOrderAction(order.id, 'ready')
                        }}
                      >
                        Mark Ready
                      </Button>
                    )}
                    
                    {order.status === 'ready' && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOrderAction(order.id, 'completed')
                        }}
                      >
                        Complete Order
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            )
          })}
          
          {orders.length === 0 && (
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 6, 
                  textAlign: 'center', 
                  bgcolor: 'background.paper'
                }}
              >
                <MenuIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  No Active Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders will appear here as they come in from the POS system
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  )
}
