import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
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
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) {
            return { user: null, error: authError.message }
          }

          if (authData.user) {
            // Fetch user profile with organization info
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select(`
                *,
                organizations!inner(
                  name,
                  logo_url
                )
              `)
              .eq('id', authData.user.id)
              .single()

            // If user profile doesn't exist, create a basic one
            if (userError || !userData) {
              // Get first organization to assign user to
              const { data: orgs } = await supabase
                .from('organizations')
                .select('id, name')
                .limit(1)
                .single()

              if (orgs) {
                // Create user profile
                const { data: newUser, error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: authData.user.id,
                    email: authData.user.email || email,
                    first_name: authData.user.user_metadata?.first_name || 'Admin',
                    last_name: authData.user.user_metadata?.last_name || 'User',
                    role: 'admin',
                    organization_id: orgs.id,
                    is_active: true
                  })
                  .select(`
                    *,
                    organizations!inner(
                      name,
                      logo_url
                    )
                  `)
                  .single()

                if (!createError && newUser) {
                  userData = newUser
                } else {
                  console.error('Failed to create user profile:', createError)
                  return { user: null, error: `Failed to create user profile: ${createError?.message || 'Unknown error'}` }
                }
              } else {
                return { user: null, error: 'No organization found. Please complete business setup first at /setup' }
              }
            }

            const user: AuthUser = {
              id: userData.id,
              email: userData.email,
              full_name: `${userData.first_name} ${userData.last_name}`,
              firstName: userData.first_name,
              lastName: userData.last_name,
              role: userData.role as UserRole,
              permissions: userData.permissions || [],
              is_super_admin: userData.is_super_admin || false,
              department: userData.department,
              created_by: userData.created_by,
              organizationId: userData.organization_id || '',
              organization_id: userData.organization_id || '',
              locationId: userData.location_id,
              location_id: userData.location_id,
              isActive: userData.is_active || false,
              pin: userData.pin,
              pinEnabled: userData.pin_enabled,
              employeeId: userData.employee_id,
              organizationName: userData.organizations?.name,
              logoUrl: userData.organizations?.logo_url,
              created_at: userData.created_at,
              updated_at: userData.updated_at
            }

            set({ user, isAuthenticated: true, isLoading: false })
            return { user, error: null }
          }

          return { user: null, error: 'Authentication failed' }
        } catch (error) {
          return { user: null, error: 'An unexpected error occurred' }
        }
      },

      signInWithPin: async (pin: string, locationId?: string) => {
        try {
          // Find user by PIN and location
          let query = supabase
            .from('users')
            .select('*')
            .eq('pin', pin)
            .eq('pin_enabled', true)
            .eq('is_active', true)

          if (locationId) {
            query = query.eq('location_id', locationId)
          }

          const { data: userData, error: userError } = await query.single()

          if (userError || !userData) {
            return { user: null, error: 'Invalid PIN or user not found' }
          }

          // Create a session for PIN-based login (simplified auth)
          const user: AuthUser = {
            id: userData.id,
            email: userData.email,
            full_name: `${userData.first_name} ${userData.last_name}`,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role as UserRole,
            permissions: userData.permissions || [],
            is_super_admin: userData.is_super_admin || false,
            department: userData.department,
            created_by: userData.created_by,
            organizationId: userData.organization_id || '',
            organization_id: userData.organization_id || '',
            locationId: userData.location_id,
            location_id: userData.location_id,
            isActive: userData.is_active || false,
            pin: userData.pin,
            pinEnabled: userData.pin_enabled,
            employeeId: userData.employee_id,
            created_at: userData.created_at,
            updated_at: userData.updated_at
          }

          set({ user, isAuthenticated: true, isLoading: false })
          return { user, error: null }
        } catch (error) {
          return { user: null, error: 'Authentication failed' }
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      initializeAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            // Fetch user profile with organization info
            const { data: userData, error } = await supabase
              .from('users')
              .select(`
                *,
                organizations!inner(
                  name,
                  logo_url
                )
              `)
              .eq('id', session.user.id)
              .single()

            if (!error && userData) {
              const user: AuthUser = {
                id: userData.id,
                email: userData.email,
                full_name: `${userData.first_name} ${userData.last_name}`,
                firstName: userData.first_name,
                lastName: userData.last_name,
                role: userData.role as UserRole,
                permissions: userData.permissions || [],
                is_super_admin: userData.is_super_admin || false,
                department: userData.department,
                created_by: userData.created_by,
                organizationId: userData.organization_id || '',
                organization_id: userData.organization_id || '',
                locationId: userData.location_id,
                location_id: userData.location_id,
                isActive: userData.is_active || false,
                pin: userData.pin,
                pinEnabled: userData.pin_enabled,
                employeeId: userData.employee_id,
                organizationName: userData.organizations?.name,
                logoUrl: userData.organizations?.logo_url,
                created_at: userData.created_at,
                updated_at: userData.updated_at
              }

              set({ user, isAuthenticated: true, isLoading: false })
              return
            }
          }

          set({ user: null, isAuthenticated: false, isLoading: false })
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (updates: Partial<AuthUser>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      checkSetupNeeded: async () => {
        try {
          const { data: organizations, error } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)

          if (error) {
            console.error('Error checking organizations:', error)
            return false
          }

          return !organizations || organizations.length === 0
        } catch (error) {
          console.error('Error checking setup needed:', error)
          return false
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