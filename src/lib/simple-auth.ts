import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export interface SimpleUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  organizationId: string
  locationId?: string
  isActive: boolean
  pin?: string
  pinEnabled?: boolean
}

export class SimpleAuth {
  // Create user with hashed password
  static async createUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
    organizationId: string
    locationId?: string
  }): Promise<{ user: SimpleUser | null; error: string | null }> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          organization_id: userData.organizationId,
          location_id: userData.locationId,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      const user: SimpleUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        organizationId: data.organization_id,
        locationId: data.location_id,
        isActive: data.is_active,
        pin: data.pin,
        pinEnabled: data.pin_enabled
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  }

  // Login with email/password
  static async signIn(email: string, password: string): Promise<{ user: SimpleUser | null; error: string | null }> {
    try {
      // Get user by email
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { user: null, error: 'Invalid email or password' }
      }

      // Verify password
      const isValid = await bcrypt.compare(password, data.password_hash)
      if (!isValid) {
        return { user: null, error: 'Invalid email or password' }
      }

      const user: SimpleUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        organizationId: data.organization_id,
        locationId: data.location_id,
        isActive: data.is_active,
        pin: data.pin,
        pinEnabled: data.pin_enabled
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  }

  // Login with PIN
  static async signInWithPin(pin: string): Promise<{ user: SimpleUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('pin_enabled', true)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { user: null, error: 'Invalid PIN' }
      }

      const user: SimpleUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        organizationId: data.organization_id,
        locationId: data.location_id,
        isActive: data.is_active,
        pin: data.pin,
        pinEnabled: data.pin_enabled
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  }
}