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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Admin Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System management and analytics
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={loadDashboardData}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="Staff Management" />
          <Tab label="Products" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>
        {currentTab === 0 && (
          <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {formatCurrency(stats.totalSales)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sales
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
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {stats.totalOrders}
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
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {stats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
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
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Restaurant />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Products
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tables */}
        <Grid container spacing={3}>
          {/* Users Table */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Users Management
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={user.role === 'admin' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
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
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Products Management
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={product.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
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
          <StaffManagement />
        )}

        {currentTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>
                Products Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setProductDialogOpen(true)}
              >
                Add Product
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={product.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
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
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
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
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
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
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProduct} variant="contained">Create Product</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}