'use client'

import { useRouter } from 'next/navigation'
import { Shield, Users, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-8 left-8 text-white flex items-center gap-2 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-lg">Back</span>
      </button>

      {/* Logo */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <img 
            src="/yaya-logo.png" 
            alt="Yaya Xtra Residence Logo" 
            style={{ 
              height: '100px', 
              width: 'auto'
            }} 
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">Yaya Xtra Residence POS</h1>
        <p className="text-gray-400">Point of Sale System</p>
      </div>

      {/* Login Cards */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        {/* Admin Login Card */}
        <div 
          onClick={() => router.push('/login/admin')}
          className="flex-1 bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#1a1a1a]">Admin Login</h2>
            <p className="text-gray-600">
              Managers and administrators access
            </p>
          </div>
        </div>

        {/* Staff Login Card */}
        <div 
          onClick={() => router.push('/login/staff')}
          className="flex-1 bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#1a1a1a]">Staff Login</h2>
            <p className="text-gray-600">
              Waiters, kitchen staff, and cashiers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
