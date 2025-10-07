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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material'
import {
  Download as DownloadIcon,
  TrendingUp,
  Schedule,
  Category,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface SalesAnalytics {
  hourly: { hour: string; sales: number; orders: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  categoryPerformance: { category: string; sales: number; orders: number }[]
  serverPerformance: { server: string; orders: number; sales: number }[]
}

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <AnalyticsDashboard />
    </RoleGuard>
  )
}

function AnalyticsDashboard() {
  const { user } = useAuthStore()
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [currentTab, setCurrentTab] = useState(0)
  const [analytics, setAnalytics] = useState<SalesAnalytics>({
    hourly: [],
    topProducts: [],
    categoryPerformance: [],
    serverPerformance: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.locationId) {
      loadAnalytics()
    }
  }, [user?.locationId, timeRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() }
  }

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      await Promise.all([
        loadHourlySales(startDate, endDate),
        loadTopProducts(startDate, endDate),
        loadCategoryPerformance(startDate, endDate),
        loadServerPerformance(startDate, endDate)
      ])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHourlySales = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('location_id', user.locationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'cancelled')

    const hourlyData: { [key: string]: { sales: number; orders: number } } = {}

    data?.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      const hourKey = `${hour}:00`

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { sales: 0, orders: 0 }
      }

      hourlyData[hourKey].sales += order.total_amount || 0
      hourlyData[hourKey].orders += 1
    })

    const hourly = Object.entries(hourlyData)
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    setAnalytics(prev => ({ ...prev, hourly }))
  }

  const loadTopProducts = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products(name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const productMap: { [key: string]: { quantity: number; revenue: number } } = {}

    data?.forEach(item => {
      const productName = (item.products as any)?.name || 'Unknown'
      if (!productMap[productName]) {
        productMap[productName] = { quantity: 0, revenue: 0 }
      }
      productMap[productName].quantity += item.quantity
      productMap[productName].revenue += item.total_price || 0
    })

    const topProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    setAnalytics(prev => ({ ...prev, topProducts }))
  }

  const loadCategoryPerformance = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products(categories(name))
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const categoryMap: { [key: string]: { sales: number; orders: number } } = {}

    data?.forEach(item => {
      const categoryName = (item.products as any)?.categories?.name || 'Uncategorized'
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { sales: 0, orders: 0 }
      }
      categoryMap[categoryName].sales += item.total_price || 0
      categoryMap[categoryName].orders += item.quantity
    })

    const categoryPerformance = Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.sales - a.sales)

    setAnalytics(prev => ({ ...prev, categoryPerformance }))
  }

  const loadServerPerformance = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('orders')
      .select(`
        total_amount,
        users(first_name, last_name)
      `)
      .eq('location_id', user.locationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'cancelled')

    const serverMap: { [key: string]: { orders: number; sales: number } } = {}

    data?.forEach(order => {
      const user = order.users as any
      const serverName = user ? `${user.first_name} ${user.last_name}` : 'Unknown'
      if (!serverMap[serverName]) {
        serverMap[serverName] = { orders: 0, sales: 0 }
      }
      serverMap[serverName].orders += 1
      serverMap[serverName].sales += order.total_amount || 0
    })

    const serverPerformance = Object.entries(serverMap)
      .map(([server, data]) => ({ server, ...data }))
      .sort((a, b) => b.sales - a.sales)

    setAnalytics(prev => ({ ...prev, serverPerformance }))
  }

  const handleExport = () => {
    // Generate CSV export
    let csv = 'Analytics Report\n\n'
    csv += `Time Range: ${timeRange}\n\n`

    csv += 'Top Products\n'
    csv += 'Product,Quantity,Revenue\n'
    analytics.topProducts.forEach(p => {
      csv += `${p.name},${p.quantity},${p.revenue}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString()}.csv`
    a.click()
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
            Sales Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Deep insights into your business performance
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab icon={<Schedule />} label="Hourly Trends" />
          <Tab icon={<TrendingUp />} label="Top Products" />
          <Tab icon={<Category />} label="Categories" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Sales by Hour
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Sales"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Top Selling Products
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Product Rankings
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="right"><strong>Qty</strong></TableCell>
                      <TableCell align="right"><strong>Revenue</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topProducts.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {currentTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Category Performance
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Server Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Server</strong></TableCell>
                      <TableCell align="right"><strong>Orders</strong></TableCell>
                      <TableCell align="right"><strong>Sales</strong></TableCell>
                      <TableCell align="right"><strong>Avg Order</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.serverPerformance.map((server, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{server.server}</TableCell>
                        <TableCell align="right">{server.orders}</TableCell>
                        <TableCell align="right">{formatCurrency(server.sales)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(server.sales / server.orders)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

