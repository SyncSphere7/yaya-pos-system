'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { UserRole, Permission, ROLE_PERMISSIONS, getRoleDisplayName } from '@/lib/permissions'
import { PermissionGuard } from '@/components/auth/permission-guard'

interface User {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: UserRole
  permissions: Permission[]
  is_super_admin: boolean
  department?: string
  is_active: boolean
  pin?: string
  created_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuthStore()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    full_name: '',
    role: 'waiter' as UserRole,
    department: '',
    password: '',
    pin: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const isAdminRole = (role: UserRole) => {
    return ['super_admin', 'accounts_manager', 'operations_manager', 'inventory_manager', 'menu_manager'].includes(role)
  }

  const isStaffRole = (role: UserRole) => {
    return ['waiter', 'kitchen', 'cashier', 'manager'].includes(role)
  }

  const handleCreateUser = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isAdminRole(formData.role)) {
        // Create admin user with email/password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              full_name: `${formData.first_name} ${formData.last_name}`,
              role: formData.role,
              permissions: ROLE_PERMISSIONS[formData.role],
              is_super_admin: formData.role === 'super_admin',
              department: formData.department || null,
              organization_id: currentUser?.organization_id,
              location_id: currentUser?.location_id,
              is_active: true,
              pin_enabled: false,
              created_by: currentUser?.id
            })

          if (userError) throw userError
        }
      } else {
        // Create staff user with PIN only (no Supabase Auth)
        const staffId = crypto.randomUUID()
        
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: staffId,
            full_name: formData.full_name,
            role: formData.role,
            permissions: ROLE_PERMISSIONS[formData.role],
            is_super_admin: false,
            department: formData.department,
            organization_id: currentUser?.organization_id,
            location_id: currentUser?.location_id,
            is_active: true,
            pin: formData.pin,
            pin_enabled: true,
            created_by: currentUser?.id
          })

        if (userError) throw userError
      }

      await fetchUsers()
      setDialogOpen(false)
      resetForm()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setLoading(true)
    setError(null)

    try {
      const updateData: any = {
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role],
        is_super_admin: formData.role === 'super_admin',
        department: formData.department || null
      }

      if (isAdminRole(formData.role)) {
        updateData.first_name = formData.first_name
        updateData.last_name = formData.last_name
        updateData.full_name = `${formData.first_name} ${formData.last_name}`
        updateData.pin_enabled = false
        updateData.pin = null
      } else {
        updateData.full_name = formData.full_name
        updateData.pin = formData.pin
        updateData.pin_enabled = true
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', editingUser.id)

      if (error) throw error

      await fetchUsers()
      setDialogOpen(false)
      setEditingUser(null)
      resetForm()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)

      if (error) throw error
      await fetchUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setEditingUser(null)
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    if (isAdminRole(user.role)) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: '',
        role: user.role,
        department: user.department || '',
        password: '',
        pin: ''
      })
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        full_name: user.full_name || '',
        role: user.role,
        department: user.department || '',
        password: '',
        pin: user.pin || ''
      })
    }
    setEditingUser(user)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      full_name: '',
      role: 'waiter',
      department: '',
      password: '',
      pin: ''
    })
  }

  const getRoleChipColor = (role: UserRole) => {
    const colors: Record<UserRole, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      super_admin: 'error',
      accounts_manager: 'warning',
      operations_manager: 'warning',
      inventory_manager: 'warning',
      menu_manager: 'warning',
      manager: 'info',
      waiter: 'default',
      kitchen: 'success',
      cashier: 'default'
    }
    return colors[role] || 'default'
  }

  const getUserDisplayName = (user: User) => {
    if (user.full_name) return user.full_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    return user.email || 'Unknown'
  }

  return (
    <PermissionGuard permission="users.read">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            User Management
          </Typography>
          <PermissionGuard permission="users.create">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{ bgcolor: '#1a1a1a' }}
            >
              Add User
            </Button>
          </PermissionGuard>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Login Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.is_super_admin && <SecurityIcon color="error" fontSize="small" />}
                      {getUserDisplayName(user)}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleDisplayName(user.role)}
                      color={getRoleChipColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.pin ? 'PIN' : 'Email/Password'}
                      color={user.pin ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <PermissionGuard permission="users.update">
                      <IconButton onClick={() => openEditDialog(user)} size="small">
                        <EditIcon />
                      </IconButton>
                    </PermissionGuard>
                    <PermissionGuard permission="users.delete">
                      <IconButton 
                        onClick={() => handleDeleteUser(user.id)} 
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </PermissionGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit User Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <MenuItem value="super_admin">Super Administrator</MenuItem>
                <MenuItem value="accounts_manager">Accounts Manager</MenuItem>
                <MenuItem value="operations_manager">Operations Manager</MenuItem>
                <MenuItem value="inventory_manager">Inventory Manager</MenuItem>
                <MenuItem value="menu_manager">Menu Manager</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="waiter">Waiter</MenuItem>
                <MenuItem value="kitchen">Kitchen Staff</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
              </Select>
            </FormControl>

            {/* Admin User Fields */}
            {isAdminRole(formData.role) && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  margin="normal"
                  disabled={!!editingUser}
                />
                {!editingUser && (
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    margin="normal"
                  />
                )}
              </>
            )}

            {/* Staff User Fields */}
            {isStaffRole(formData.role) && (
              <>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="4-Digit PIN"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  margin="normal"
                  inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
                />
              </>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Restaurant">Restaurant</MenuItem>
                <MenuItem value="Bar">Bar</MenuItem>
                <MenuItem value="Fumes">Fumes</MenuItem>
                <MenuItem value="Kitchen">Kitchen</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#1a1a1a' }}
            >
              {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  )
}