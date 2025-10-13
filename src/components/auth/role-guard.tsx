'use client'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Box, CircularProgress } from '@mui/material'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/login' }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (user && !allowedRoles.includes(user.role)) {
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            router.push('/admin')
            break
          case 'waiter':
          case 'cashier':
            router.push('/pos')
            break
          case 'kitchen':
            router.push('/kitchen')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, router, redirectTo])

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    )
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
