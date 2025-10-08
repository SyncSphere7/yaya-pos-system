'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function FinancePage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <FinanceManagement />
    </RoleGuard>
  )
}

function FinanceManagement() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ revenue: 0, cost: 0, profit: 0, profitMargin: 0, cashPayments: 0, cardPayments: 0, mobilePayments: 0 })
  const [payments, setPayments] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today')

  useEffect(() => {
    if (user?.locationId) loadFinancialData()
  }, [user?.locationId, timeRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    if (timeRange === 'today') startDate.setHours(0, 0, 0, 0)
    else if (timeRange === 'week') startDate.setDate(now.getDate() - 7)
    else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1)
    else startDate.setFullYear(now.getFullYear() - 1)
    return { startDate: startDate.toISOString(), endDate: now.toISOString() }
  }

  const loadFinancialData = async () => {
    setIsLoading(true)
    const { startDate, endDate } = getDateRange()
    await Promise.all([loadStats(startDate, endDate), loadPayments(startDate, endDate), loadPaymentMethodBreakdown(startDate, endDate), loadDailyRevenue(startDate, endDate)])
    setIsLoading(false)
  }

  const loadStats = async (startDate: string, endDate: string) => {
    const { data: orders } = await supabase.from('orders').select('total_amount, subtotal').eq('location_id', user?.locationId).eq('status', 'paid').gte('created_at', startDate).lte('created_at', endDate)
    const { data: orderItems } = await supabase.from('order_items').select('unit_price, quantity, products(cost)').gte('created_at', startDate).lte('created_at', endDate)
    const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const cost = orderItems?.reduce((sum, item) => sum + ((item.products as any)?.cost || 0) * item.quantity, 0) || 0
    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0
    const { data: payments } = await supabase.from('payments').select('amount, method').eq('status', 'completed').gte('created_at', startDate).lte('created_at', endDate)
    const cashPayments = payments?.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0) || 0
    const cardPayments = payments?.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0) || 0
    const mobilePayments = payments?.filter(p => ['mtn_momo', 'airtel_pay', 'pesapal'].includes(p.method)).reduce((sum, p) => sum + p.amount, 0) || 0
    setStats({ revenue, cost, profit, profitMargin, cashPayments, cardPayments, mobilePayments })
  }

  const loadPayments = async (startDate: string, endDate: string) => {
    const { data } = await supabase.from('payments').select('*, orders(order_number)').gte('created_at', startDate).lte('created_at', endDate).order('created_at', { ascending: false }).limit(50)
    setPayments(data || [])
  }

  const loadPaymentMethodBreakdown = async (startDate: string, endDate: string) => {
    const { data } = await supabase.from('payments').select('method, amount').eq('status', 'completed').gte('created_at', startDate).lte('created_at', endDate)
    const methodMap: { [key: string]: number } = {}
    data?.forEach(payment => { methodMap[payment.method] = (methodMap[payment.method] || 0) + payment.amount })
    setPaymentMethods(Object.entries(methodMap).map(([method, amount]) => ({ name: method.replace('_', ' ').toUpperCase(), value: amount })))
  }

  const loadDailyRevenue = async (startDate: string, endDate: string) => {
    const { data } = await supabase.from('orders').select('total_amount, created_at').eq('location_id', user?.locationId).eq('status', 'paid').gte('created_at', startDate).lte('created_at', endDate)
    const dailyMap: { [key: string]: number } = {}
    data?.forEach(order => { const date = new Date(order.created_at).toLocaleDateString(); dailyMap[date] = (dailyMap[date] || 0) + order.total_amount })
    setDailyRevenue(Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue })).slice(-14))
  }

  const handleExport = () => {
    let csv = `Financial Report\n\nPeriod: ${timeRange}\nRevenue: ${formatCurrency(stats.revenue)}\nCost: ${formatCurrency(stats.cost)}\nProfit: ${formatCurrency(stats.profit)}\nProfit Margin: ${stats.profitMargin.toFixed(2)}%\n\nRecent Payments\nDate,Order,Method,Amount,Status\n`
    payments.forEach(p => csv += `${new Date(p.created_at).toLocaleString()},${(p.orders as any)?.order_number},${p.method},${p.amount},${p.status}\n`)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${timeRange}-${new Date().toISOString()}.csv`
    a.click()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Management</h1>
          <p className="text-gray-400 mt-1">Track revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-3">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-[#2a2a2a] text-white px-4 py-2 rounded-lg border border-gray-700">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={handleExport} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">From {timeRange}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.cost)}</p>
          <p className="text-xs text-gray-500 mt-1">Cost of goods sold</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(stats.profit)}</p>
          <p className="text-xs text-gray-500 mt-1">After expenses</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Profit Margin</p>
          <p className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Profitability ratio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Cash Payments</p>
          <p className="text-xl font-bold">{formatCurrency(stats.cashPayments)}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Card Payments</p>
          <p className="text-xl font-bold">{formatCurrency(stats.cardPayments)}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Mobile Payments</p>
          <p className="text-xl font-bold">{formatCurrency(stats.mobilePayments)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Daily Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                {paymentMethods.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Order</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(payment.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">{(payment.orders as any)?.order_number || '-'}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{payment.method.replace('_', ' ').toUpperCase()}</span></td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{payment.status}</span></td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
