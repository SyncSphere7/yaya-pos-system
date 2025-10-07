      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Department Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Filter by Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Filter by Department"
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight={700}>
                {filteredTables.filter(t => t.status === 'available').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="error.main" fontWeight={700}>
                {filteredTables.filter(t => t.status === 'occupied').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupied
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" fontWeight={700}>
                {filteredTables.filter(t => t.status === 'reserved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reserved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700}>
                {filteredTables.reduce((sum, t) => sum + t.capacity, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Seats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables by Section */}
      {Object.entries(groupedTables).map(([section, sectionTables]) => (
        <Box key={section} sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {section}
          </Typography>
          <Grid container spacing={2}>
            {sectionTables.map((table) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <Card
                  sx={{
                    borderLeft: 4,
                    borderColor: (table.departments as any)?.color || 'primary.main'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TableRestaurant fontSize="large" />
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {table.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(table.departments as any)?.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={table.status}
                        color={getStatusColor(table.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <EventSeat fontSize="small" />
                      <Typography variant="body2">
                        Capacity: {table.capacity} seats
                      </Typography>
                    </Box>

                    <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                      <Select
                        value={table.status}
                        onChange={(e) => handleUpdateStatus(table.id, e.target.value as any)}
                      >
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="occupied">Occupied</MenuItem>
                        <MenuItem value="reserved">Reserved</MenuItem>
                        <MenuItem value="cleaning">Cleaning</MenuItem>
                      </Select>
                    </FormControl>

                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(table)}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(table.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {filteredTables.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <TableRestaurant sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tables configured yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding tables to your floor plan
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add First Table
          </Button>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTable ? 'Edit Table' : 'Add New Table'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Table Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., T1, A1, VIP 1"
            />

            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department_id}
                label="Department"
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              fullWidth
              required
              InputProps={{ inputProps: { min: 1, max: 20 } }}
            />

            <TextField
              label="Section (Optional)"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              fullWidth
              placeholder="e.g., Main Floor, Patio, VIP"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTable ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableRestaurant,
  EventSeat,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

interface Table {
  id: string
  name: string
  capacity: number
  section: string | null
  status: 'available' | 'occupied' | 'cleaning' | 'reserved'
  department_id: string
  departments?: { name: string; color: string }
}

interface Department {
  id: string
  name: string
  color: string
}

export default function TablesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <TablesManagement />
    </RoleGuard>
  )
}

function TablesManagement() {
  const { user } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    capacity: '4',
    section: '',
    department_id: ''
  })

  useEffect(() => {
    if (user?.locationId) {
      loadData()
    }
  }, [user?.locationId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadDepartments(), loadTables()])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDepartments = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('departments')
      .select('id, name, color')
      .eq('location_id', user.locationId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    setDepartments(data || [])
    if (data && data.length > 0 && !formData.department_id) {
      setFormData(prev => ({ ...prev, department_id: data[0].id }))
    }
  }

  const loadTables = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('tables')
      .select(`
        *,
        departments(name, color)
      `)
      .eq('location_id', user.locationId)
      .order('name')

    if (error) throw error
    setTables(data || [])
  }

  const filteredTables = tables.filter(table =>
    selectedDepartment === 'all' || table.department_id === selectedDepartment
  )

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table)
      setFormData({
        name: table.name,
        capacity: table.capacity.toString(),
        section: table.section || '',
        department_id: table.department_id
      })
    } else {
      setEditingTable(null)
      setFormData({
        name: '',
        capacity: '4',
        section: '',
        department_id: departments[0]?.id || ''
      })
    }
    setDialogOpen(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!user?.locationId) return

    try {
      setError(null)

      const tableData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        section: formData.section || null,
        department_id: formData.department_id,
        location_id: user.locationId,
        status: 'available' as const
      }

      if (editingTable) {
        const { error } = await supabase
          .from('tables')
          .update(tableData)
          .eq('id', editingTable.id)

        if (error) throw error
        setSuccess('Table updated successfully')
      } else {
        const { error } = await supabase
          .from('tables')
          .insert(tableData)

        if (error) throw error
        setSuccess('Table created successfully')
      }

      await loadTables()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error
      setSuccess('Table deleted successfully')
      await loadTables()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateStatus = async (tableId: string, newStatus: Table['status']) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('id', tableId)

      if (error) throw error
      await loadTables()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'occupied': return 'error'
      case 'cleaning': return 'warning'
      case 'reserved': return 'info'
      default: return 'default'
    }
  }

  const groupedTables = filteredTables.reduce((acc, table) => {
    const section = table.section || 'Main Area'
    if (!acc[section]) acc[section] = []
    acc[section].push(table)
    return acc
  }, {} as Record<string, Table[]>)

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
            Table Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your restaurant tables and seating arrangements
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Table
        </Button>

