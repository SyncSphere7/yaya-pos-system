'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Permission } from '@/lib/permissions'
import { Box, Typography, Paper } from '@mui/material'
import { Lock as LockIcon } from '@mui/icons-material'

interface PermissionGuardProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ 
  permission, 
  permissions = [], 
  requireAll = false, 
  fallback, 
  children 
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuthStore()

  if (!user) {
    return fallback || <AccessDenied message="Authentication required" />
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return fallback || <AccessDenied message="Insufficient permissions" />
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p))

    if (!hasRequiredPermissions) {
      return fallback || <AccessDenied message="Insufficient permissions" />
    }
  }

  return <>{children}</>
}

function AccessDenied({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 3
      }}
    >
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
          bgcolor: 'grey.50'
        }}
      >
        <LockIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Paper>
    </Box>
  )
}