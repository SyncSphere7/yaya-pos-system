'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  People,
  Restaurant,
  AttachMoney,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { StaffManagement } from '@/components/admin/staff-management'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  activeUsers: number
  totalProducts: number
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  category_id: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <AdminDashboard />
    </RoleGuard>
  )
}

function AdminDashboard() {
  const { user } = useAuthStore()
  const [currentTab, setCurrentTab] = useState(0)
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalProducts: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'waiter',
    password: ''
  })
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: ''
  })

  useEffect(() => {
    if (user?.locationId) {
      loadDashboardData()
    }
  }, [user?.locationId])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadProducts()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user?.locationId) return

    const [salesResult, ordersResult, usersResult, productsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount')
        .eq('location_id', user.locationId)
        .eq('status', 'paid'),
      supabase
        .from('orders')
        .select('id')
        .eq('location_id', user.locationId),
      supabase
        .from('users')
        .select('id')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id')
        .eq('location_id', user.locationId)
        .eq('is_active', true)
    ])

    const totalSales = salesResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    
    setStats({
      totalSales,
      totalOrders: ordersResult.data?.length || 0,
      activeUsers: usersResult.data?.length || 0,
      totalProducts: productsResult.data?.length || 0
    })
  }

  const loadUsers = async () => {
    if (!user?.organizationId) return

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setUsers(data || [])
  }

  const loadProducts = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('location_id', user.locationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setProducts(data || [])
  }

  const handleCreateUser = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userForm.email,
        password: userForm.password,
        email_confirm: true
      })

      if (authError) throw authError

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userForm.email,
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          role: userForm.role,
          organization_id: user?.organizationId,
          location_id: user?.locationId
        })

      if (userError) throw userError

      setUserDialogOpen(false)
      setUserForm({ email: '', first_name: '', last_name: '', role: 'waiter', password: '' })
      loadUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleCreateProduct = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: productForm.name,
          price: parseFloat(productForm.price),
          description: productForm.description,
          location_id: user?.locationId
        })

      if (error) throw error

      setProductDialogOpen(false)
      setProductForm({ name: '', price: '', description: '' })
      loadProducts()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error
      loadProducts()
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#1a1a1a', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={24}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'white',
          mb: 3
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img 
                src="/yaya-logo.png" 
                alt="Yaya Xtra Residence Logo" 
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  objectFit: 'contain'
                }} 
              />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                System management and analytics
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            sx={{
              borderColor: '#1a1a1a',
              color: '#1a1a1a',
              '&:hover': {
                borderColor: '#2d2d2d',
                bgcolor: 'rgba(26, 26, 26, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper
        elevation={24}
        sx={{
          borderRadius: 4,
          bgcolor: 'white',
          mb: 3
        }}
      >
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab label="Dashboard" />
          <Tab label="Staff Management" />
          <Tab label="Products" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {currentTab === 0 && (
          <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={24} sx={{ borderRadius: 4, bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <AttachMoney sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                      {formatCurrency(stats.totalSales)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Total Sales
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={24} sx={{ borderRadius: 4, bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <TrendingUp sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                      {stats.totalOrders}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={24} sx={{ borderRadius: 4, bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <People sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                      {stats.activeUsers}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Active Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={24} sx={{ borderRadius: 4, bgcolor: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <Restaurant sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Products
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Grid>
        </Grid>

        {/* Tables */}
        <Grid container spacing={3}>
          {/* Users Table */}
          <Grid item xs={12} xl={6}>
            <Paper elevation={24} sx={{ p: 4, borderRadius: 4, bgcolor: 'white' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                Users Management
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.slice(0, 10).map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="medium"
                            color={user.role === 'admin' ? 'error' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="medium"
                            color={user.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            sx={{
                              bgcolor: 'rgba(26, 26, 26, 0.04)',
                              '&:hover': { bgcolor: 'rgba(26, 26, 26, 0.08)' }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Products Table */}
          <Grid item xs={12} xl={6}>
            <Paper elevation={24} sx={{ p: 4, borderRadius: 4, bgcolor: 'white' }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                Products Management
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.slice(0, 10).map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight={600}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight={600} color="success.main">
                            {formatCurrency(product.price)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.is_active ? 'Active' : 'Inactive'}
                            size="medium"
                            color={product.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            sx={{
                              bgcolor: 'rgba(26, 26, 26, 0.04)',
                              '&:hover': { bgcolor: 'rgba(26, 26, 26, 0.08)' }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        </>
        )}

        {currentTab === 1 && (
          <Paper elevation={24} sx={{ p: 4, borderRadius: 4, bgcolor: 'white' }}>
            <StaffManagement />
          </Paper>
        )}

        {currentTab === 2 && (
          <Paper elevation={24} sx={{ p: 4, borderRadius: 4, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                Products Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setProductDialogOpen(true)}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#2d2d2d'
                  }
                }}
              >
                Add Product
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          {formatCurrency(product.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.is_active ? 'Active' : 'Inactive'}
                          size="medium"
                          color={product.is_active ? 'success' : 'default'}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          sx={{
                            bgcolor: 'rgba(26, 26, 26, 0.04)',
                            '&:hover': { bgcolor: 'rgba(26, 26, 26, 0.08)' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* User Dialog */}
      <Dialog 
        open={userDialogOpen} 
        onClose={() => setUserDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1a1a1a' }}>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="First Name"
            value={userForm.first_name}
            onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={userForm.last_name}
            onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <MenuItem value="waiter">Waiter</MenuItem>
              <MenuItem value="kitchen">Kitchen</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setUserDialogOpen(false)}
            variant="outlined"
            sx={{
              borderColor: '#1a1a1a',
              color: '#1a1a1a',
              fontWeight: 600,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            sx={{
              bgcolor: '#1a1a1a',
              color: 'white',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#2d2d2d'
              }
            }}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog 
        open={productDialogOpen} 
        onClose={() => setProductDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1a1a1a' }}>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Product Name"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setProductDialogOpen(false)}
            variant="outlined"
            sx={{
              borderColor: '#1a1a1a',
              color: '#1a1a1a',
              fontWeight: 600,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProduct} 
            variant="contained"
            sx={{
              bgcolor: '#1a1a1a',
              color: 'white',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#2d2d2d'
              }
            }}
          >
            Create Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}