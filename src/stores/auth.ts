import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { SimpleAuth } from '@/lib/simple-auth'
import { User as PermissionUser, UserRole, Permission, hasPermission, canAccessRoute } from '@/lib/permissions'

export interface AuthUser extends PermissionUser {
  firstName: string
  lastName: string
  isActive: boolean
  pinEnabled?: boolean
  employeeId?: string
  organizationName?: string
  logoUrl?: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>
  signInWithPin: (pin: string, locationId?: string) => Promise<{ user: AuthUser | null; error: string | null }>
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => void
  checkSetupNeeded: () => Promise<boolean>
  hasPermission: (permission: Permission) => boolean
  canAccessRoute: (route: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        try {
          const result = await SimpleAuth.signIn(email, password)
          
          if (result.user && !result.error) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              full_name: `${result.user.firstName} ${result.user.lastName}`,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              role: result.user.role as UserRole,
              permissions: [],
              is_super_admin: false,
              department: undefined,
              created_by: undefined,
              organizationId: result.user.organizationId,
              organization_id: parseInt(result.user.organizationId),
              locationId: result.user.locationId,
              location_id: result.user.locationId ? parseInt(result.user.locationId) : undefined,
              isActive: result.user.isActive,
              pin: result.user.pin,
              pinEnabled: result.user.pinEnabled,
              employeeId: undefined,
              organizationName: undefined,
              logoUrl: undefined,
              created_at: undefined,
              updated_at: undefined
            }

            set({ user, isAuthenticated: true, isLoading: false })
            return { user, error: null }
          }
          
          return { user: null, error: result.error || 'Authentication failed' }
        } catch (error) {
          return { user: null, error: 'An unexpected error occurred' }
        }
      },

      signInWithPin: async (pin: string, locationId?: string) => {
        try {
          const result = await SimpleAuth.signInWithPin(pin)
          
          if (result.user && !result.error) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              full_name: `${result.user.firstName} ${result.user.lastName}`,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              role: result.user.role as UserRole,
              permissions: [],
              is_super_admin: false,
              department: undefined,
              created_by: undefined,
              organizationId: result.user.organizationId,
              organization_id: parseInt(result.user.organizationId),
              locationId: result.user.locationId,
              location_id: result.user.locationId ? parseInt(result.user.locationId) : undefined,
              isActive: result.user.isActive,
              pin: result.user.pin,
              pinEnabled: result.user.pinEnabled,
              employeeId: undefined,
              organizationName: undefined,
              logoUrl: undefined,
              created_at: undefined,
              updated_at: undefined
            }

            set({ user, isAuthenticated: true, isLoading: false })
            return { user, error: null }
          }
          
          return { user: null, error: result.error || 'Invalid PIN' }
        } catch (error) {
          return { user: null, error: 'Authentication failed' }
        }
      },

      signOut: async () => {
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      initializeAuth: async () => {
        // For custom auth, no persistent sessions
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      updateUser: (updates: Partial<AuthUser>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      checkSetupNeeded: async () => {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: organizations, error } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)

          if (error) {
            console.error('Error checking organizations:', error)
            return true
          }

          return !organizations || organizations.length === 0
        } catch (error) {
          console.error('Error checking setup needed:', error)
          return true
        }
      },

      hasPermission: (permission: Permission) => {
        const { user } = get()
        return hasPermission(user, permission)
      },

      canAccessRoute: (route: string) => {
        const { user } = get()
        return canAccessRoute(user, route)
      },
    }),
    { name: 'auth-store' }
  )
)