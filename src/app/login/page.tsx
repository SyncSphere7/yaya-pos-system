'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

export default function LoginPage() {
  const [mode, setMode] = useState<'admin' | 'staff'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn, signInWithPin } = useAuthStore()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const result = await signIn(email, password)
    setIsLoading(false)
    
    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    const result = await signInWithPin(pin)
    setIsLoading(false)
    
    if (result.success) {
      const role = result.user?.role
      if (role === 'waiter' || role === 'cashier') router.push('/pos')
      else if (role === 'kitchen') router.push('/kitchen')
      else router.push('/admin')
    } else {
      setError(result.error || 'Invalid PIN')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">YAYA POS</h1>
          <p className="text-gray-600">Point of Sale System</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('admin')} className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'admin' ? 'bg-[#D4AF37] text-black' : 'bg-gray-200 text-gray-700'}`}>Admin</button>
          <button onClick={() => setMode('staff')} className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'staff' ? 'bg-[#D4AF37] text-black' : 'bg-gray-200 text-gray-700'}`}>Staff</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        {mode === 'admin' ? (
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-semibold hover:bg-[#c4a137] disabled:opacity-50">
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Enter PIN</label>
              <input type="password" maxLength={4} pattern="[0-9]{4}" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest" placeholder="••••" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-semibold hover:bg-[#c4a137] disabled:opacity-50">
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
