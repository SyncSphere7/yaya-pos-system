export type Permission = 
  // User Management
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  // Financial
  | 'finance.read' | 'finance.reports' | 'payments.manage' | 'analytics.financial'
  // Operations
  | 'staff.manage' | 'operations.read' | 'scheduling.manage' | 'tables.manage' | 'reports.operational'
  // Inventory
  | 'inventory.read' | 'inventory.write' | 'products.manage' | 'suppliers.manage' | 'stock.reports'
  // Menu Management
  | 'menu.read' | 'menu.write' | 'categories.manage' | 'products.pricing' | 'modifiers.manage'
  // POS Operations
  | 'pos.access' | 'kitchen.access' | 'orders.create' | 'orders.update' | 'orders.complete'
  // System
  | 'system.settings' | 'reports.basic' | 'staff.view' | 'tables.assign' | 'payments.process'

export type UserRole = 
  | 'super_admin' | 'accounts_manager' | 'operations_manager' 
  | 'inventory_manager' | 'menu_manager' | 'manager' 
  | 'waiter' | 'kitchen' | 'cashier'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  permissions: Permission[]
  is_super_admin: boolean
  department?: string
  created_by?: string
  pin?: string
  location_id: string
  organization_id: string
  created_at: string
  updated_at: string
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ['*'] as any,
  accounts_manager: ['finance.read', 'finance.reports', 'payments.manage', 'analytics.financial'],
  operations_manager: ['staff.manage', 'operations.read', 'scheduling.manage', 'tables.manage', 'reports.operational'],
  inventory_manager: ['inventory.read', 'inventory.write', 'products.manage', 'suppliers.manage', 'stock.reports'],
  menu_manager: ['menu.read', 'menu.write', 'categories.manage', 'products.pricing', 'modifiers.manage'],
  manager: ['pos.access', 'kitchen.access', 'reports.basic', 'staff.view'],
  waiter: ['pos.access', 'orders.create', 'tables.assign'],
  kitchen: ['kitchen.access', 'orders.update'],
  cashier: ['pos.access', 'payments.process', 'orders.complete']
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  
  // Super admin has all permissions
  if (user.is_super_admin || user.permissions.includes('*' as Permission)) {
    return true
  }
  
  return user.permissions.includes(permission)
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.some(permission => hasPermission(user, permission))
}

export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false
  
  const routePermissions: Record<string, Permission[]> = {
    '/admin/finance': ['finance.read', 'finance.reports'],
    '/admin/staff': ['staff.manage', 'operations.read'],
    '/admin/inventory': ['inventory.read', 'inventory.write'],
    '/admin/menu': ['menu.read', 'menu.write'],
    '/admin/reports': ['finance.reports', 'reports.operational', 'reports.basic'],
    '/admin/settings': ['system.settings'],
    '/pos': ['pos.access'],
    '/kitchen': ['kitchen.access']
  }
  
  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) return true
  
  return hasAnyPermission(user, requiredPermissions)
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    accounts_manager: 'Accounts Manager',
    operations_manager: 'Operations Manager',
    inventory_manager: 'Inventory Manager',
    menu_manager: 'Menu Manager',
    manager: 'Manager',
    waiter: 'Waiter',
    kitchen: 'Kitchen Staff',
    cashier: 'Cashier'
  }
  
  return roleNames[role] || role
}

export function getPermissionDisplayName(permission: Permission): string {
  const permissionNames: Record<Permission, string> = {
    'users.create': 'Create Users',
    'users.read': 'View Users',
    'users.update': 'Update Users',
    'users.delete': 'Delete Users',
    'finance.read': 'View Financial Data',
    'finance.reports': 'Financial Reports',
    'payments.manage': 'Manage Payments',
    'analytics.financial': 'Financial Analytics',
    'staff.manage': 'Manage Staff',
    'operations.read': 'View Operations',
    'scheduling.manage': 'Manage Schedules',
    'tables.manage': 'Manage Tables',
    'reports.operational': 'Operational Reports',
    'inventory.read': 'View Inventory',
    'inventory.write': 'Update Inventory',
    'products.manage': 'Manage Products',
    'suppliers.manage': 'Manage Suppliers',
    'stock.reports': 'Stock Reports',
    'menu.read': 'View Menu',
    'menu.write': 'Update Menu',
    'categories.manage': 'Manage Categories',
    'products.pricing': 'Manage Pricing',
    'modifiers.manage': 'Manage Modifiers',
    'pos.access': 'POS Access',
    'kitchen.access': 'Kitchen Access',
    'orders.create': 'Create Orders',
    'orders.update': 'Update Orders',
    'orders.complete': 'Complete Orders',
    'system.settings': 'System Settings',
    'reports.basic': 'Basic Reports',
    'staff.view': 'View Staff',
    'tables.assign': 'Assign Tables',
    'payments.process': 'Process Payments'
  }
  
  return permissionNames[permission] || permission
}