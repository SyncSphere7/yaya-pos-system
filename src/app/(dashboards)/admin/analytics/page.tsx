'use client'

import { useState } from 'react'
import { Box, Paper, Typography, Grid, Button, ButtonGroup, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import { Download, DateRange } from '@mui/icons-material'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week')
  const [department, setDepartment] = useState('all')

  const salesData = [
    { date: '2024-01-01', revenue: 12000, orders: 45, customers: 38 },
    { date: '2024-01-02', revenue: 15000, orders: 52, customers: 45 },
    { date: '2024-01-03', revenue: 18000, orders: 61, customers: 52 },
    { date: '2024-01-04', revenue: 14000, orders: 48, customers: 41 },
    { date: '2024-01-05', revenue: 22000, orders: 75, customers: 63 },
    { date: '2024-01-06', revenue: 25000, orders: 82, customers: 71 },
    { date: '2024-01-07', revenue: 20000, orders: 68, customers: 58 }
  ]

  const categoryData = [
    { name: 'Food', value: 45000 },
    { name: 'Drinks', value: 32000 },
    { name: 'Hookah', value: 18000 }
  ]

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
          Analytics & Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          sx={{
            bgcolor: '#D4AF37',
            color: '#1a1a1a',
            fontWeight: 600,
            '&:hover': { bgcolor: '#C19B2E' }
          }}
        >
          Export Report
        </Button>
      </Box>

      {/* Filters */}
      <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <ButtonGroup fullWidth>
              {['day', 'week', 'month', 'year'].map((p) => (
                <Button
                  key={p}
                  onClick={() => setPeriod(p)}
                  variant={period === p ? 'contained' : 'outlined'}
                  sx={{
                    bgcolor: period === p ? '#D4AF37' : 'transparent',
                    color: period === p ? '#1a1a1a' : '#1a1a1a',
                    borderColor: '#D4AF37',
                    '&:hover': { bgcolor: period === p ? '#C19B2E' : 'rgba(212, 175, 55, 0.1)' }
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="Department">
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="restaurant">Restaurant</MenuItem>
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="fumes">Fumes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Orders & Customers */}
        <Grid item xs={12} md={4}>
          <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Orders vs Customers
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#D4AF37" />
                <Bar dataKey="customers" fill="#1a1a1a" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Performance */}
        <Grid item xs={12}>
          <Paper elevation={24} sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Category Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
