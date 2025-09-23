'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { usePOSStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  Chip,
  Badge,
  IconButton,
  ButtonGroup,
  Divider,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material'
import {
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  TableRestaurant as TableIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  Fastfood as FastfoodIcon,
  LocalDining as DiningIcon,
  DeliveryDining as DeliveryIcon,
  TakeoutDining as TakeoutIcon,
} from '@mui/icons-material'
import { formatCurrency } from '@/lib/utils'

export default function POSPage() {
  return (
    <RoleGuard allowedRoles={['waiter', 'cashier', 'manager', 'admin']}>
      <POSInterface />
    </RoleGuard>
  )
}

function POSInterface() {
  const { user } = useAuthStore()
  const {
    cart,
    products,
    categories,
    selectedCategory,
    selectedTable,
    orderType,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    loadProducts,
    loadCategories,
    setSelectedCategory,
    setSelectedTable,
    setOrderType,
    submitOrder
  } = usePOSStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user?.locationId) {
      loadProducts(user.locationId)
      loadCategories(user.locationId)
    }
  }, [user?.locationId, loadProducts, loadCategories])

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = cartTotal * 0.18
  const finalTotal = cartTotal + taxAmount

  const handleSubmitOrder = async () => {
    setIsSubmitting(true)
    const result = await submitOrder()
    
    if (result.success) {
      alert('Order submitted successfully!')
    } else {
      alert(`Error: ${result.error}`)
    }
    
    setIsSubmitting(false)
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <DiningIcon />
      case 'takeout':
        return <TakeoutIcon />
      case 'delivery':
        return <DeliveryIcon />
      default:
        return <FastfoodIcon />
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <ReceiptIcon />
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              POS Terminal
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            {/* Order Type Selector */}
            <ButtonGroup variant="contained" size="large">
              <Button
                startIcon={<DiningIcon />}
                onClick={() => setOrderType('dine_in')}
                variant={orderType === 'dine_in' ? 'contained' : 'outlined'}
                sx={{ minWidth: 120 }}
              >
                Dine In
              </Button>
              <Button
                startIcon={<TakeoutIcon />}
                onClick={() => setOrderType('takeout')}
                variant={orderType === 'takeout' ? 'contained' : 'outlined'}
                sx={{ minWidth: 120 }}
              >
                Takeout
              </Button>
              <Button
                startIcon={<DeliveryIcon />}
                onClick={() => setOrderType('delivery')}
                variant={orderType === 'delivery' ? 'contained' : 'outlined'}
                sx={{ minWidth: 120 }}
              >
                Delivery
              </Button>
            </ButtonGroup>

            {/* Table Selector for Dine In */}
            {orderType === 'dine_in' && (
              <Button
                variant="outlined"
                startIcon={<TableIcon />}
                size="large"
                sx={{ minWidth: 140 }}
              >
                {selectedTable ? `Table ${selectedTable}` : 'Select Table'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Products */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Categories */}
          <Paper 
            sx={{ 
              m: 2, 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box display="flex" gap={1} sx={{ overflowX: 'auto', pb: 1 }}>
              <Chip
                label="All Items"
                onClick={() => setSelectedCategory(null)}
                color={selectedCategory === null ? 'primary' : 'default'}
                variant={selectedCategory === null ? 'filled' : 'outlined'}
                size="medium"
                sx={{ minWidth: 100, fontWeight: 500 }}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => setSelectedCategory(category.id)}
                  color={selectedCategory === category.id ? 'primary' : 'default'}
                  variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                  size="medium"
                  sx={{ minWidth: 100, fontWeight: 500 }}
                />
              ))}
            </Box>
          </Paper>

          {/* Products Grid */}
          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            <Grid container spacing={2}>
              {filteredProducts.map((product) => {
                const cartItem = cart.find(item => item.productId === product.id)
                const quantity = cartItem?.quantity || 0

                return (
                  <Grid xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid',
                        borderColor: quantity > 0 ? 'primary.main' : 'divider',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => addToCart(product)}
                    >
                      {product.imageUrl && (
                        <CardMedia
                          component="img"
                          height="120"
                          image={product.imageUrl}
                          alt={product.name}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="h6" 
                          fontWeight={600} 
                          gutterBottom
                          sx={{ 
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            minHeight: '2.6em',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.name}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 1, minHeight: '3em' }}
                        >
                          {product.description}
                        </Typography>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary" fontWeight={600}>
                            {formatCurrency(product.price)}
                          </Typography>
                          
                          {quantity > 0 && (
                            <Chip
                              label={quantity}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>

            {filteredProducts.length === 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: 200,
                  color: 'text.secondary'
                }}
              >
                <FastfoodIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">No products available</Typography>
                <Typography variant="body2">
                  {selectedCategory ? 'Try selecting a different category' : 'Products will appear here once added'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Panel - Cart */}
        <Paper 
          sx={{ 
            width: 400, 
            display: 'flex', 
            flexDirection: 'column',
            m: 2,
            ml: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Cart Header */}
          <Box 
            sx={{ 
              p: 3, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: '8px 8px 0 0'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <CartIcon />
                <Typography variant="h6" fontWeight={600}>
                  Current Order
                </Typography>
              </Box>
              <Badge badgeContent={cart.length} color="secondary">
                <CartIcon />
              </Badge>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              {getOrderTypeIcon(orderType)}
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {orderType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {selectedTable && ` • Table ${selectedTable}`}
              </Typography>
            </Box>
          </Box>

          {/* Cart Items */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {cart.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: 200,
                  color: 'text.secondary',
                  p: 3
                }}
              >
                <CartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>Cart is empty</Typography>
                <Typography variant="body2" textAlign="center">
                  Add items from the menu to get started
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {cart.map((item, index) => (
                  <ListItem key={index} sx={{ py: 2, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <FastfoodIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={500}>
                          {item.product?.name || 'Unknown Item'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.unitPrice)} each
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            Subtotal: {formatCurrency(item.totalPrice)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton 
                        size="small"
                        onClick={() => removeFromCart(item.productId)}
                        color="error"
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography variant="body1" fontWeight={600} sx={{ minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => addToCart(products.find(p => p.id === item.productId)!)}
                        color="primary"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Cart Summary & Actions */}
          {cart.length > 0 && (
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Totals */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(cartTotal)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Tax (18%):</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(taxAmount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={600}>Total:</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    {formatCurrency(finalTotal)}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box display="flex" gap={2} mb={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ClearIcon />}
                  onClick={clearCart}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PaymentIcon />}
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  sx={{ py: 1.5 }}
                >
                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Pay Now'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
