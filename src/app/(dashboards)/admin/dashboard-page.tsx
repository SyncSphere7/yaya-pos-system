'use client'

import { useEffect, useState } from 'react'
import { Box, Grid, Paper, Typography, Avatar } from '@mui/material'
import {
  AttachMoney,
  TrendingUp,
  People,
  Restaurant
} from '@mui/icons-material'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#D4AF37', '#1a1a1a', '#10B981', '#3B82F6']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalProducts: 0
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])

  useEffect(() => {
    if (user?.locationId) {
      loadDashboardData()
      const interval = setInterval(loadDashboardData, 30000) // Real-time: refresh every 30s
      return () => clearInterval(interval)
    }
  }, [user?.locationId])

  const loadDashboardData = async () => {
    if (!user?.locationId) return

    // Load stats
    const [salesResult, ordersResult, usersResult, productsResult] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('location_id', user.locationId).eq('status', 'paid'),
      supabase.from('orders').select('id').eq('location_id', user.locationId),
      supabase.from('users').select('id').eq('organization_id', user.organizationId).eq('is_active', true),
      supabase.from('products').select('id').eq('location_id', user.locationId).eq('is_active', true)
    ])

    setStats({
      totalSales: salesResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      totalOrders: ordersResult.data?.length || 0,
      activeUsers: usersResult.data?.length || 0,
      totalProducts: productsResult.data?.length || 0
    })

    // Mock sales data (replace with real data)
    setSalesData([
      { name: 'Mon', sales: 4000 },
      { name: 'Tue', sales: 3000 },
      { name: 'Wed', sales: 5000 },
      { name: 'Thu', sales: 4500 },
      { name: 'Fri', sales: 6000 },
      { name: 'Sat', sales: 7000 },
      { name: 'Sun', sales: 5500 }
    ])

    // Mock department data
    setDepartmentData([
      { name: 'Restaurant', value: 45 },
      { name: 'Bar', value: 35 },
      { name: 'Fumes', value: 20 }
    ])
  }

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Total Sales', value: formatCurrency(stats.totalSales), icon: <AttachMoney />, color: '#10B981' },
          { title: 'Total Orders', value: stats.totalOrders, icon: <TrendingUp />, color: '#3B82F6' },
          { title: 'Active Users', value: stats.activeUsers, icon: <People />, color: '#F59E0B' },
          { title: 'Products', value: stats.totalProducts, icon: <Restaurant />, color: '#D4AF37' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={24} sx={{ borderRadius: 3, bgcolor: 'white', height: 70 }}>
              <Box sx={{ p: 1.5, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box display="flex" alignItems="center" gap={1.5} width="100%">
                  <Avatar sx={{ bgcolor: stat.color, width: 35, height: 35 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', fontSize: '1.1rem' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Sales Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Weekly Sales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Department Performance */}
        <Grid item xs={12} md={4}>
          <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Department Sales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
