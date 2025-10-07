  description: string | null
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

const DEPARTMENT_ICONS = {
  Restaurant: <Restaurant fontSize="large" />,
  Bar: <LocalBar fontSize="large" />,
  Fumes: <Smoking fontSize="large" />
}

const DEFAULT_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
]

export default function DepartmentsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <DepartmentsManagement />
    </RoleGuard>
  )
}

function DepartmentsManagement() {
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<Department[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: 'Restaurant' as 'Restaurant' | 'Bar' | 'Fumes',
    description: '',
    color: DEFAULT_COLORS[0],
    is_active: true
  })

  useEffect(() => {
    if (user?.locationId) {
      loadDepartments()
    }
  }, [user?.locationId])

  const loadDepartments = async () => {
    if (!user?.locationId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('location_id', user.locationId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setDepartments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept)
      setFormData({
        name: dept.name as any,
        description: dept.description || '',
        color: dept.color,
        is_active: dept.is_active
      })
    } else {
      setEditingDept(null)
      setFormData({
        name: 'Restaurant',
        description: '',
        color: DEFAULT_COLORS[0],
        is_active: true
      })
    }
    setDialogOpen(true)
    setError(null)
    setSuccess(null)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingDept(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!user?.locationId) return

    try {
      setError(null)

      if (editingDept) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            description: formData.description,
            color: formData.color,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDept.id)

        if (error) throw error
        setSuccess('Department updated successfully')
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert({
            location_id: user.locationId,
            name: formData.name,
            description: formData.description,
            color: formData.color,
            is_active: formData.is_active,
            sort_order: departments.length
          })

        if (error) throw error
        setSuccess('Department created successfully')
      }

      await loadDepartments()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? This will affect all related products and orders.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId)

      if (error) throw error
      setSuccess('Department deleted successfully')
      await loadDepartments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (deptId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: !currentStatus })
        .eq('id', deptId)

      if (error) throw error
      await loadDepartments()
    } catch (err: any) {
      setError(err.message)
    }
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
            Department Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage your business departments
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Department
        </Button>
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

      {/* Departments Grid */}
      <Grid container spacing={3}>
        {departments.map((dept) => (
          <Grid item xs={12} sm={6} md={4} key={dept.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderTop: 4,
                borderColor: dept.color,
                opacity: dept.is_active ? 1 : 0.6
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: dept.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {DEPARTMENT_ICONS[dept.name as keyof typeof DEPARTMENT_ICONS]}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {dept.name}
                    </Typography>
                    <Chip
                      label={dept.is_active ? 'Active' : 'Inactive'}
                      color={dept.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {dept.description || 'No description'}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dept.is_active}
                      onChange={() => handleToggleActive(dept.id, dept.is_active)}
                      color="primary"
                    />
                  }
                  label="Active"
                />
                <Box>
                  <IconButton onClick={() => handleOpenDialog(dept)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(dept.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {departments.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No departments configured yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first department to start organizing your products
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Department
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDept ? 'Edit Department' : 'Create New Department'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              select
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value as any })}
              disabled={!!editingDept}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Bar">Bar</option>
              <option value="Fumes">Fumes</option>
            </TextField>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Department Color
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: color,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid black' : '1px solid #ccc',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingDept ? 'Update' : 'Create'}
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
  CardActions,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant,
  LocalBar,
  Smoking,
  Palette,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

interface Department {
  id: string
  name: string

