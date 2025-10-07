      setIsLoading(false)
    }
  }

  const loadStats = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, subtotal')
      .eq('location_id', user.locationId)
      .eq('status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('unit_price, quantity, products(cost)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const cost = orderItems?.reduce((sum, item) => {
      const itemCost = (item.products as any)?.cost || 0
      return sum + (itemCost * item.quantity)
    }, 0) || 0
    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, method')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const cashPayments = payments?.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0) || 0
    const cardPayments = payments?.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0) || 0
    const mobilePayments = payments?.filter(p => ['mtn_momo', 'airtel_pay', 'pesapal'].includes(p.method)).reduce((sum, p) => sum + p.amount, 0) || 0

    setStats({
      revenue,
      cost,
      profit,
      profitMargin,
      cashPayments,
      cardPayments,
      mobilePayments
    })
  }

  const loadPayments = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        orders(order_number)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(50)

    setPayments(data || [])
  }

  const loadPaymentMethodBreakdown = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('payments')
      .select('method, amount')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const methodMap: { [key: string]: number } = {}
    data?.forEach(payment => {
      const method = payment.method
      if (!methodMap[method]) methodMap[method] = 0
      methodMap[method] += payment.amount
    })

    const breakdown = Object.entries(methodMap).map(([method, amount]) => ({
      name: method.replace('_', ' ').toUpperCase(),
      value: amount
    }))

    setPaymentMethods(breakdown)
  }

  const loadDailyRevenue = async (startDate: string, endDate: string) => {
    if (!user?.locationId) return

    const { data } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('location_id', user.locationId)
      .eq('status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const dailyMap: { [key: string]: number } = {}
    data?.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString()
      if (!dailyMap[date]) dailyMap[date] = 0
      dailyMap[date] += order.total_amount
    })

    const daily = Object.entries(dailyMap).map(([date, revenue]) => ({
      date,
      revenue
    })).slice(-14) // Last 14 days

    setDailyRevenue(daily)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const handleExport = () => {
    let csv = 'Financial Report\n\n'
    csv += `Period: ${timeRange}\n`
    csv += `Revenue: ${formatCurrency(stats.revenue)}\n`
    csv += `Cost: ${formatCurrency(stats.cost)}\n`
    csv += `Profit: ${formatCurrency(stats.profit)}\n`
    csv += `Profit Margin: ${stats.profitMargin.toFixed(2)}%\n\n`

    csv += 'Recent Payments\n'
    csv += 'Date,Order,Method,Amount,Status\n'
    payments.forEach(p => {
      csv += `${new Date(p.created_at).toLocaleString()},${(p.orders as any)?.order_number},${p.method},${p.amount},${p.status}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${timeRange}-${new Date().toISOString()}.csv`
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
            Financial Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track revenue, expenses, and profitability
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={timeRange}
              label="Period"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {formatCurrency(stats.revenue)}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  From {timeRange}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {formatCurrency(stats.cost)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cost of goods sold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Net Profit
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatCurrency(stats.profit)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                After expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Profit Margin
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.profitMargin.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Profitability ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Daily Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payment Methods
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Methods Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Payment fontSize="large" color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cash Payments
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(stats.cashPayments)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Payment fontSize="large" color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Card Payments
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(stats.cardPayments)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Payment fontSize="large" color="info" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mobile Payments
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(stats.mobilePayments)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Payments */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Transactions
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Order</strong></TableCell>
                <TableCell><strong>Method</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Transaction ID</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    {new Date(payment.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{(payment.orders as any)?.order_number || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.method.replace('_', ' ').toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" fontWeight={600}>
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {payment.id.slice(0, 8)}...
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Receipt sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Download as DownloadIcon,
  TrendingUp,
  Payment,
  Receipt,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface FinancialStats {
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  cashPayments: number
  cardPayments: number
  mobilePayments: number
}

interface PaymentRecord {
  id: string
  order_id: string
  amount: number
  method: string
  status: string
  created_at: string
  orders?: { order_number: string }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function FinancePage() {
  return (
    <RoleGuard allowedRoles={['admin', 'accounts_manager', 'manager']}>
      <FinanceManagement />
    </RoleGuard>
  )
}

function FinanceManagement() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<FinancialStats>({
    revenue: 0,
    cost: 0,
    profit: 0,
    profitMargin: 0,
    cashPayments: 0,
    cardPayments: 0,
    mobilePayments: 0
  })
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today')
  const [currentTab, setCurrentTab] = useState(0)

  useEffect(() => {
    if (user?.locationId) {
      loadFinancialData()
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

  const loadFinancialData = async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      await Promise.all([
        loadStats(startDate, endDate),
        loadPayments(startDate, endDate),
        loadPaymentMethodBreakdown(startDate, endDate),
        loadDailyRevenue(startDate, endDate)
      ])
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {

