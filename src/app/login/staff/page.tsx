'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Delete } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export default function StaffLoginPage() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signInWithPin } = useAuthStore()
  const router = useRouter()

  const handleNumberClick = (num: string) => {
    if (pin.length < 4 && !loading) {
      setPin(prev => prev + num)
      setError(null)
    }
  }

  const handleDelete = () => {
    if (!loading) {
      setPin(prev => prev.slice(0, -1))
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('Please enter 4-digit PIN')
      return
    }

    setLoading(true)
    setError(null)
    
    const { user, error: loginError } = await signInWithPin(pin)
    
    if (loginError) {
      setError(loginError)
      setLoading(false)
      setPin('')
      return
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

  // Automatically submit when 4 digits are entered
  const handlePinChange = (newPin: string) => {
    setPin(newPin)
    if (newPin.length === 4) {
      setTimeout(() => {
        handleSubmit()
      }, 300)
    }
  }

  const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => router.push('/login')}
        className="absolute top-8 left-8 text-white flex items-center gap-2 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-lg">Back</span>
      </button>

      {/* PIN Login Card */}
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#1a1a1a]">Staff Login</h1>
          <p className="text-gray-600">Enter your 4-digit PIN</p>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                  pin.length > index
                    ? 'bg-[#1a1a1a] border-[#1a1a1a]'
                    : 'bg-white border-gray-300'
                }`}
              >
                {pin.length > index && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {numberButtons.map((num) => (
            <button
              key={num}
              onClick={() => {
                handleNumberClick(num)
                const newPin = pin + num
                if (newPin.length === 4) {
                  setTimeout(async () => {
                    setLoading(true)
                    setError(null)
                    
                    const { user, error: loginError } = await signInWithPin(newPin)
                    
                    if (loginError) {
                      setError(loginError)
                      setLoading(false)
                      setPin('')
                      return
                    }

                    if (user) {
                      if (user.role === 'kitchen') {
                        router.push('/kitchen')
                      } else {
                        router.push('/pos')
                      }
                    }
                    
                    setLoading(false)
                  }, 200)
                }
              }}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-semibold text-gray-800 h-16 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Delete className="w-5 h-5" />
          Delete
        </button>

        {loading && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">Verifying PIN...</p>
          </div>
        )}
      </div>
    </div>
  )
}