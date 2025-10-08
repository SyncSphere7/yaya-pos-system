'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Collapse,
  Divider
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Restaurant as MenuIcon,
  ShoppingCart as OrdersIcon,
  People as StaffIcon,
  Business as DepartmentsIcon,
  TableBar as TablesIcon,
  Inventory as InventoryIcon,
  AccountBalance as FinanceIcon,
  Settings as SettingsIcon,
  Menu as MenuIconButton,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/auth'

const DRAWER_WIDTH = 280

interface NavItem {
  title: string
  icon: React.ReactNode
  path: string
  children?: { title: string; path: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { title: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
  {
    title: 'Menu Management',
    icon: <MenuIcon />,
    path: '/admin/menu',
    children: [
      { title: 'Products', path: '/admin/menu/products' },
      { title: 'Categories', path: '/admin/menu/categories' },
      { title: 'Modifiers', path: '/admin/menu/modifiers' }
    ]
  },
  { title: 'Orders', icon: <OrdersIcon />, path: '/admin/orders' },
  { title: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
  { title: 'Departments', icon: <DepartmentsIcon />, path: '/admin/departments' },
  { title: 'Tables', icon: <TablesIcon />, path: '/admin/tables' },
  { title: 'Inventory', icon: <InventoryIcon />, path: '/admin/inventory' },
  { title: 'Finance', icon: <FinanceIcon />, path: '/admin/finance' },
  { title: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuthStore()

  const handleToggle = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    )
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#1a1a1a' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 70,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 70,
            boxSizing: 'border-box',
            bgcolor: 'white',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            transition: 'width 0.3s',
            overflowX: 'hidden'
          }
        }}
      >
        {/* Logo & Toggle */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {open && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <img src="/yaya-logo.png" alt="Logo" style={{ width: 40, height: 40 }} />
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                YAYA POS
              </Typography>
            </Box>
          )}
          <IconButton onClick={() => setOpen(!open)} size="small">
            {open ? <ChevronLeft /> : <MenuIconButton />}
          </IconButton>
        </Box>

        <Divider />

        {/* Navigation */}
        <List sx={{ px: 1, py: 2 }}>
          {NAV_ITEMS.map((item) => (
            <Box key={item.title}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    if (item.children) {
                      handleToggle(item.title)
                    } else {
                      router.push(item.path)
                    }
                  }}
                  selected={pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: '#D4AF37',
                      color: 'white',
                      '&:hover': { bgcolor: '#C19B2E' },
                      '& .MuiListItemIcon-root': { color: 'white' }
                    },
                    '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#1a1a1a' }}>
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                      />
                      {item.children && (expandedItems.includes(item.title) ? <ExpandLess /> : <ExpandMore />)}
                    </>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Sub-items */}
              {item.children && open && (
                <Collapse in={expandedItems.includes(item.title)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ pl: 2 }}>
                        <ListItemButton
                          onClick={() => router.push(child.path)}
                          selected={pathname === child.path}
                          sx={{
                            borderRadius: 2,
                            '&.Mui-selected': {
                              bgcolor: 'rgba(212, 175, 55, 0.2)',
                              color: '#D4AF37',
                              '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.3)' }
                            }
                          }}
                        >
                          <ListItemText
                            primary={child.title}
                            primaryTypographyProps={{ fontSize: '0.9rem' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Logout */}
        <Box sx={{ p: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#EF4444' }}>
              <LogoutIcon />
            </ListItemIcon>
            {open && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontWeight: 600, color: '#EF4444' }}
              />
            )}
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  )
}
