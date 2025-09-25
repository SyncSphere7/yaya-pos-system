'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { PinLogin } from '@/components/auth/pin-login'

export default function StaffLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signInWithPin } = useAuthStore()
  const router = useRouter()

  const handleStaffLogin = async (pin: string) => {
    setLoading(true)
    setError(null)
    
    const { user, error: loginError } = await signInWithPin(pin)
    
    if (loginError) {
      setError(loginError)
      setLoading(false)
      throw new Error(loginError)
    }

    if (user) {
      if (user.role === 'kitchen') {
        router.push('/kitchen')
      } else {
        router.push('/pos')
      }
    }
    
    setLoading(false)
  }

  const handleBack = () => {
    router.push('/login')
  }

  return (
    <PinLogin
      onLogin={handleStaffLogin}
      loading={loading}
      error={error}
      onBack={handleBack}
    />
  )
}