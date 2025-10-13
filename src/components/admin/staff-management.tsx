'use client'

import { useState, useEffect } from 'react'
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore, UserRole } from '@/stores/auth'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  pin?: string
  pinEnabled: boolean
  employeeId?: string
  isActive: boolean
  createdAt: string
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'waiter' as UserRole,
    pin: '',
    pinEnabled: true,
    employeeId: ''
  })

  useEffect(() => {
    loadStaff()
  }, [user?.locationId])

  const loadStaff = async () => {
    if (!user?.locationId) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('location_id', user.locationId)
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Map snake_case from database to camelCase for interface
      const mappedData = (data || []).map((member: any) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        role: member.role,
        pin: member.pin,
        pinEnabled: member.pin_enabled,
        employeeId: member.employee_id,
        isActive: member.is_active,
        createdAt: member.created_at
      }))
      
      setStaff(mappedData)
    } catch (error) {
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleOpenDialog = (staffMember?: StaffMember) => {
    if (staffMember) {
      setEditingStaff(staffMember)
      setFormData({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        role: staffMember.role,
        pin: staffMember.pin || '',
        pinEnabled: staffMember.pinEnabled,
        employeeId: staffMember.employeeId || ''
      })
    } else {
      setEditingStaff(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'waiter',
        pin: generateRandomPin(),
        pinEnabled: true,
        employeeId: ''
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
    setSuccess(null)
  }

  const handleSave = async () => {
    try {
      setError(null)
      
      if (formData.pinEnabled && (!formData.pin || formData.pin.length !== 4)) {
        setError('PIN must be exactly 4 digits')
        return
      }

      if (editingStaff) {
        const { error } = await supabase
          .from('users')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role: formData.role,
            pin: formData.pinEnabled ? formData.pin : null,
            pin_enabled: formData.pinEnabled,
            employee_id: formData.employeeId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStaff.id)

        if (error) throw error
        setSuccess('Staff member updated successfully')
      } else {
        const tempUserId = crypto.randomUUID()
        
        const { error } = await supabase
          .from('users')
          .insert({
            id: tempUserId,
            organization_id: user?.organizationId,
            location_id: user?.locationId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role: formData.role,
            pin: formData.pinEnabled ? formData.pin : null,
            pin_enabled: formData.pinEnabled,
            employee_id: formData.employeeId || null,
            is_active: true
          })

        if (error) throw error
        setSuccess('Staff member created successfully')
      }

      await loadStaff()
      handleCloseDialog()
    } catch (error: any) {
      setError(error.message || 'Failed to save staff member')
    }
  }

  const handleToggleActive = async (staffMember: StaffMember) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !staffMember.isActive })
        .eq('id', staffMember.id)

      if (error) throw error
      await loadStaff()
    } catch (error) {
      setError('Failed to update staff member status')
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Staff Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>PIN</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    {member.firstName} {member.lastName}
                  </Box>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Chip
                    label={member.role}
                    color={getRoleColor(member.role)}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>{member.employeeId || '-'}</TableCell>
                <TableCell>
                  {member.pinEnabled ? (
                    <Chip
                      label={`PIN: ${member.pin}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Chip label="Disabled" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={member.isActive}
                    onChange={() => handleToggleActive(member)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(member)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
              required
            />
          </Box>

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            margin="normal"
            required
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="Role"
              >
                <MenuItem value="waiter">Waiter</MenuItem>
                <MenuItem value="kitchen">Kitchen Staff</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Employee ID"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              fullWidth
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={formData.pinEnabled}
                onChange={(e) => setFormData({ ...formData, pinEnabled: e.target.checked })}
              />
            }
            label="Enable PIN Login"
            sx={{ mt: 2 }}
          />

          {formData.pinEnabled && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="4-Digit PIN"
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setFormData({ ...formData, pin: value })
                }}
                inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
                helperText="Enter exactly 4 digits"
                required
              />
              <Button
                variant="outlined"
                onClick={() => setFormData({ ...formData, pin: generateRandomPin() })}
                sx={{ mt: 1 }}
              >
                Generate Random
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.firstName || !formData.lastName || !formData.email}
          >
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}