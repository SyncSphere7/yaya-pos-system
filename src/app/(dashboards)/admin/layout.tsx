'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  Building2, 
  Table2, 
  Package, 
  DollarSign, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  title: string
  icon: React.ReactNode
  path: string
  children?: { title: string; path: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin' },
  { title: 'Analytics', icon: <TrendingUp className="w-5 h-5" />, path: '/admin/analytics' },
  {
    title: 'Menu Management',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    path: '/admin/menu',
    children: [
      { title: 'Products', path: '/admin/menu/products' },
      { title: 'Categories', path: '/admin/menu/categories' },
      { title: 'Modifiers', path: '/admin/menu/modifiers' }
    ]
  },
  { title: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, path: '/admin/orders' },
  { title: 'Staff', icon: <Users className="w-5 h-5" />, path: '/admin/staff' },
  { title: 'Departments', icon: <Building2 className="w-5 h-5" />, path: '/admin/departments' },
  { title: 'Tables', icon: <Table2 className="w-5 h-5" />, path: '/admin/tables' },
  { title: 'Inventory', icon: <Package className="w-5 h-5" />, path: '/admin/inventory' },
  { title: 'Finance', icon: <DollarSign className="w-5 h-5" />, path: '/admin/finance' },
  { title: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/admin/settings' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuthStore()

  const handleToggle = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    )
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/yaya-logo.png" alt="Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a]">YAYA POS</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.title}>
              <button
                onClick={() => {
                  if (item.children) {
                    handleToggle(item.title)
                  } else {
                    handleNavigation(item.path)
                  }
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${pathname === item.path
                    ? 'bg-[#D4AF37] text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.title}</span>
                </div>
                {item.children && (
                  expandedItems.includes(item.title)
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Sub-items */}
              {item.children && expandedItems.includes(item.title) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.path}
                      onClick={() => handleNavigation(child.path)}
                      className={`
                        w-full flex items-center px-4 py-2 rounded-lg text-sm
                        transition-colors
                        ${pathname === child.path
                          ? 'bg-[#D4AF37] bg-opacity-20 text-[#D4AF37] font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      {child.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
