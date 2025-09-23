'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useState } from 'react'
import { 
  Box,
  Grid2 as Grid,
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
  ListItemIcon,
  Container,
  CardHeader,
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon,
  Assignment as OrderIcon,
} from '@mui/icons-material'

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <AdminDashboard />
    </RoleGuard>
  )
}

function AdminDashboard() {
  const { user, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  const handleSignOut = async () => {
    await signOut()
  }

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: DashboardIcon },
    { id: 'sales', name: 'Sales Analytics', icon: AnalyticsIcon },
    { id: 'orders', name: 'Order Management', icon: OrderIcon },
    { id: 'inventory', name: 'Inventory', icon: InventoryIcon },
    { id: 'locations', name: 'Locations', icon: StoreIcon },
    { id: 'staff', name: 'Staff Management', icon: PeopleIcon },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navigation */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <Typography variant="h6" fontWeight={600}>Y</Typography>
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                YaYa POS Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Restaurant Management System
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Box textAlign="right">
              <Typography variant="body2" fontWeight={500}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {user?.role}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box display="flex">
        {/* Sidebar Navigation */}
        <Paper 
          sx={{ 
            width: 280, 
            minHeight: 'calc(100vh - 64px)',
            borderRadius: 0,
            borderRight: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 2 }}>
            <List sx={{ py: 0 }}>
              {navigationItems.map((item) => (
                <ListItem
                  key={item.id}
                  component="button"
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: activeTab === item.id ? 'primary.light' : 'transparent',
                    color: activeTab === item.id ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: activeTab === item.id ? 'primary.light' : 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Container maxWidth="xl">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'sales' && <SalesTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'staff' && <StaffTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

function OverviewTab() {
  const mockStats = {
    todaySales: 12450,
    todayOrders: 87,
    averageOrder: 143,
    customerSatisfaction: 4.8
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your restaurant management dashboard
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    KES {mockStats.todaySales.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today&apos;s Sales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {mockStats.todayOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    KES {mockStats.averageOrder}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Order
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {mockStats.customerSatisfaction}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Quick Actions"
              titleTypographyProps={{ fontWeight: 600 }}
            />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button variant="outlined" fullWidth startIcon={<ReceiptIcon />}>
                  View Today&apos;s Orders
                </Button>
                <Button variant="outlined" fullWidth startIcon={<InventoryIcon />}>
                  Check Inventory
                </Button>
                <Button variant="outlined" fullWidth startIcon={<PeopleIcon />}>
                  Manage Staff
                </Button>
                <Button variant="outlined" fullWidth startIcon={<SettingsIcon />}>
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader 
              title="System Status"
              titleTypographyProps={{ fontWeight: 600 }}
            />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">POS System</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={95} color="success" />
                </Box>
                
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Kitchen Display</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={98} color="success" />
                </Box>
                
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Payment Gateway</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={100} color="success" />
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  All systems are running smoothly
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Placeholder functions for other tabs
function SalesTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Sales Analytics
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Sales analytics coming soon...</Typography>
      </Paper>
    </Box>
  )
}

function OrdersTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Order Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Order management interface coming soon...</Typography>
      </Paper>
    </Box>
  )
}

function InventoryTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Inventory Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Inventory management coming soon...</Typography>
      </Paper>
    </Box>
  )
}

function LocationsTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Location Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Location management coming soon...</Typography>
      </Paper>
    </Box>
  )
}

function StaffTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Staff Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Staff management coming soon...</Typography>
      </Paper>
    </Box>
  )
}

function SettingsTab() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        System Settings
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">System settings coming soon...</Typography>
      </Paper>
    </Box>
  )
}
