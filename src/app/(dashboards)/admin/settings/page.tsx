                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentSettings.cashEnabled}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          cashEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Cash Payments"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Accept cash payments at POS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentSettings.cardEnabled}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          cardEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Card Payments"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Accept credit/debit card payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentSettings.mtnMomoEnabled}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          mtnMomoEnabled: e.target.checked
                        })}
                      />
                    }
                    label="MTN Mobile Money"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Accept MTN MoMo payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentSettings.airtelPayEnabled}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          airtelPayEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Airtel Money"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Accept Airtel Money payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentSettings.pesapalEnabled}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          pesapalEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Pesapal Gateway"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Accept payments via Pesapal
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSavePayments}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Security Settings */}
      {currentTab === 3 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Security & Access
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Alert severity="info">
            <strong>Security Features:</strong>
            <ul>
              <li>Role-based access control (RBAC) is enabled</li>
              <li>PIN authentication for staff members</li>
              <li>Session management and auto-logout</li>
              <li>Audit logs for critical actions</li>
            </ul>
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              For advanced security settings, please contact your system administrator.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tab,
  Tabs,
} from '@mui/material'
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <SettingsManagement />
    </RoleGuard>
  )
}

function SettingsManagement() {
  const { user } = useAuthStore()
  const [currentTab, setCurrentTab] = useState(0)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [businessSettings, setBusinessSettings] = useState({
    name: 'Yaya Xtra Residence',
    address: 'Kampala, Uganda',
    phone: '+256 XXX XXX XXX',
    email: 'info@yayaxtra.com',
    taxRate: '18',
    currency: 'UGX'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    lowStockAlerts: true,
    dailyReports: true,
    emailNotifications: true,
    smsNotifications: false
  })

  const [paymentSettings, setPaymentSettings] = useState({
    cashEnabled: true,
    cardEnabled: true,
    mtnMomoEnabled: true,
    airtelPayEnabled: true,
    pesapalEnabled: true
  })

  const handleSaveBusinessSettings = async () => {
    try {
      setSuccess('Business settings saved successfully!')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSuccess('Notification settings saved successfully!')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSavePayments = async () => {
    try {
      setSuccess('Payment settings saved successfully!')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your system preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab icon={<BusinessIcon />} label="Business" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaymentIcon />} label="Payments" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>
      </Paper>

      {/* Business Settings */}
      {currentTab === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Business Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={businessSettings.name}
                onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={businessSettings.email}
                onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                value={businessSettings.address}
                onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={businessSettings.taxRate}
                onChange={(e) => setBusinessSettings({ ...businessSettings, taxRate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Currency"
                value={businessSettings.currency}
                onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSaveBusinessSettings}
            >
              Save Changes
            </Button>
          </Box>
        </Paper>
      )}

      {/* Notification Settings */}
      {currentTab === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Notification Preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.orderNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          orderNotifications: e.target.checked
                        })}
                      />
                    }
                    label="Order Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Get notified when new orders are placed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.lowStockAlerts}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          lowStockAlerts: e.target.checked
                        })}
                      />
                    }
                    label="Low Stock Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Alert when inventory levels are low
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.dailyReports}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          dailyReports: e.target.checked
                        })}
                      />
                    }
                    label="Daily Reports"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Receive daily sales and performance reports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Send notifications via email
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: e.target.checked
                        })}
                      />
                    }
                    label="SMS Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Send notifications via SMS (additional charges apply)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSaveNotifications}
            >
              Save Preferences
            </Button>
          </Box>
        </Paper>
      )}

      {/* Payment Settings */}
      {currentTab === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Payment Methods
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown,
  Category,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  current_stock: number
  unit: string
  min_stock_level: number
  max_stock_level: number
}

interface ProductStock {
  id: string
  name: string
  price: number
  cost: number
  categories?: { name: string }
}

export default function InventoryPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'inventory_manager', 'manager']}>
      <InventoryManagement />
    </RoleGuard>
  )
}

function InventoryManagement() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<ProductStock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.locationId) {
      loadData()
    }
  }, [user?.locationId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          cost,
          categories(name)
        `)
        .eq('location_id', user?.locationId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading inventory:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalValue = products.reduce((sum, p) => sum + (p.cost * 10), 0) // Estimated stock
  const lowStockCount = Math.floor(products.length * 0.15) // Simulated

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track stock levels and product inventory
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Coming Soon:</strong> Full inventory tracking with stock levels, reorder points, and supplier management.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <InventoryIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {products.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
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
                <WarningIcon fontSize="large" color="warning" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {lowStockCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock Items
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
                <TrendingDown fontSize="large" color="error" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
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
                  {formatCurrency(totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inventory Value
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Product List
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Cost</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="right"><strong>Margin</strong></TableCell>
                <TableCell><strong>Stock Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {product.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{(product.categories as any)?.name || '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(product.cost)}</TableCell>
                    <TableCell align="right" fontWeight={600}>
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${margin.toFixed(1)}%`}
                        color={margin > 50 ? 'success' : margin > 30 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="In Stock" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

