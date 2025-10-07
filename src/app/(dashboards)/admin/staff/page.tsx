  pin: string | null
  pin_enabled: boolean
  is_active: boolean
  department: string | null
  created_at: string
}

const STAFF_ROLES: UserRole[] = ['waiter', 'kitchen', 'cashier', 'manager']

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <StaffManagement />
    </RoleGuard>
  )
}

function StaffManagement() {
  const { user } = useAuthStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState(0)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'waiter' as UserRole,
    pin: '',
    pin_enabled: true,
    department: '',
    is_active: true
  })

  useEffect(() => {
    if (user?.locationId) {
      loadStaff()
    }
  }, [user?.locationId])

  const loadStaff = async () => {
    if (!user?.locationId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('location_id', user.locationId)
        .in('role', STAFF_ROLES)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleOpenDialog = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member)
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        role: member.role,
        pin: member.pin || '',
        pin_enabled: member.pin_enabled,
        department: member.department || '',
        is_active: member.is_active
      })
    } else {
      setEditingStaff(null)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'waiter',
        pin: generateRandomPin(),
        pin_enabled: true,
        department: '',
        is_active: true
      })
    }
    setDialogOpen(true)
    setError(null)
    setSuccess(null)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingStaff(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!user?.locationId) return

    try {
      setError(null)

      if (formData.pin_enabled && (!formData.pin || formData.pin.length !== 4)) {
        setError('PIN must be exactly 4 digits')
        return
      }

      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        pin: formData.pin_enabled ? formData.pin : null,
        pin_enabled: formData.pin_enabled,
        department: formData.department || null,
        is_active: formData.is_active,
        location_id: user.locationId,
        organization_id: user.organization_id
      }

      if (editingStaff) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingStaff.id)

        if (error) throw error
        setSuccess('Staff member updated successfully')
      } else {
        // For new staff, we create without auth (PIN-only login)
        const { error } = await supabase
          .from('users')
          .insert({
            ...userData,
            id: crypto.randomUUID(),
            created_by: user.id
          })

        if (error) throw error
        setSuccess('Staff member created successfully')
      }

      await loadStaff()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      setSuccess('Staff member deleted successfully')
      await loadStaff()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', staffId)

      if (error) throw error
      await loadStaff()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'manager': return 'primary'
      case 'waiter': return 'success'
      case 'kitchen': return 'warning'
      case 'cashier': return 'info'
      default: return 'default'
    }
  }

  const filteredStaff = staff.filter(s => {
    if (currentTab === 0) return true
    const roles = ['waiter', 'kitchen', 'cashier', 'manager']
    return s.role === roles[currentTab - 1]
  })

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
            Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your team members and their access
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStaff}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Staff
          </Button>
        </Box>
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="primary">
              {staff.filter(s => s.is_active).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Staff
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {staff.filter(s => s.role === 'waiter').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Waiters
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="warning.main">
              {staff.filter(s => s.role === 'kitchen').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kitchen Staff
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="info.main">
              {staff.filter(s => s.role === 'cashier').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cashiers
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label={`All (${staff.length})`} />
          <Tab label={`Waiters (${staff.filter(s => s.role === 'waiter').length})`} />
          <Tab label={`Kitchen (${staff.filter(s => s.role === 'kitchen').length})`} />
          <Tab label={`Cashiers (${staff.filter(s => s.role === 'cashier').length})`} />
          <Tab label={`Managers (${staff.filter(s => s.role === 'manager').length})`} />
        </Tabs>
      </Paper>

      {/* Staff Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Staff Member</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>PIN</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {member.first_name[0]}{member.last_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {member.first_name} {member.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={member.role}
                      color={getRoleColor(member.role) as any}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{member.department || '-'}</TableCell>
                  <TableCell>
                    {member.pin_enabled ? (
                      <Chip
                        icon={<LockIcon />}
                        label={member.pin || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Disabled
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={member.is_active}
                      onChange={() => handleToggleActive(member.id, member.is_active)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(member)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <PersonIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No staff members found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <MenuItem value="waiter">Waiter</MenuItem>
                <MenuItem value="kitchen">Kitchen Staff</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Department (Optional)"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              fullWidth
              placeholder="e.g., Restaurant, Bar"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.pin_enabled}
                  onChange={(e) => setFormData({ ...formData, pin_enabled: e.target.checked })}
                />
              }
              label="Enable PIN Login"
            />

            {formData.pin_enabled && (
              <Box>
                <TextField
                  label="4-Digit PIN"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData({ ...formData, pin: value })
                  }}
                  fullWidth
                  required
                  inputProps={{ maxLength: 4 }}
                  helperText="Staff will use this PIN to login"
                />
                <Button
                  size="small"
                  onClick={() => setFormData({ ...formData, pin: generateRandomPin() })}
                  sx={{ mt: 1 }}
                >
                  Generate Random PIN
                </Button>
              </Box>
            )}

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
            {editingStaff ? 'Update' : 'Create'}
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { UserRole } from '@/lib/permissions'

interface StaffMember {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole

