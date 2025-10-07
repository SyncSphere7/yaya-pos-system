              </Typography>
            </Box>
          </Box>
          <Chip
            label={user?.role}
            size="small"
            color="primary"
            sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
          />
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
          sx={{ borderRadius: 2 }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: 1
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIconBurger />
            </IconButton>
            <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
              Yaya POS Admin
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                bgcolor: 'white'
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                border: 'none',
                bgcolor: 'white',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          mt: { xs: 8, md: 0 }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Button,
  Divider,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp as AnalyticsIcon,
  Receipt as OrderIcon,
  Restaurant as MenuIcon,
  Inventory as InventoryIcon,
  People as StaffIcon,
  TableRestaurant as TableIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIconBurger,
  AttachMoney as FinanceIcon,
  Store as DepartmentIcon,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/auth'

const DRAWER_WIDTH = 280

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  permissions?: string[]
}

const navigationItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <DashboardIcon />, path: '/admin' },
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
  { id: 'orders', label: 'Orders', icon: <OrderIcon />, path: '/admin/orders' },
  { id: 'departments', label: 'Departments', icon: <DepartmentIcon />, path: '/admin/departments' },
  { id: 'menu', label: 'Menu Management', icon: <MenuIcon />, path: '/admin/menu' },
  { id: 'tables', label: 'Tables', icon: <TableIcon />, path: '/admin/tables' },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, path: '/admin/inventory' },
  { id: 'staff', label: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
  { id: 'finance', label: 'Finance', icon: <FinanceIcon />, path: '/admin/finance' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
            fontWeight: 700,
            fontSize: '1.5rem'
          }}
        >
          Y
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Yaya POS
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin Dashboard
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                  },
                  transition: 'all 0.2s',
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{
                  color: 'inherit',
                  minWidth: 40,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider />

      {/* User Section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          mb: 2
        }}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}

