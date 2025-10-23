'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export default function DebugAuthPage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user: storeUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check Supabase Auth Session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setAuthUser(currentSession?.user || null)

      // Check Database User
      if (currentSession?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()

        if (!error && userData) {
          setDbUser(userData)
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'yayaxtra@gmail.com',
      password: 'Admin@123'
    })

    if (error) {
      alert('Login Error: ' + error.message)
    } else {
      alert('Login Success! Check the page details.')
      checkAuth()
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    checkAuth()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Authentication Debug Page</h1>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handleTestLogin}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Login (yayaxtra@gmail.com)
            </button>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
            <button
              onClick={checkAuth}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Zustand Store State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Zustand Store State</h2>
          <div className="space-y-2">
            <p className="text-lg">
              <strong>Is Authenticated:</strong>{' '}
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </p>
            <p className="text-lg">
              <strong>Store User:</strong>{' '}
              {storeUser ? (
                <span className="text-green-600">✅ Exists</span>
              ) : (
                <span className="text-red-600">❌ Null</span>
              )}
            </p>
            {storeUser && (
              <pre className="bg-gray-50 p-4 rounded mt-4 overflow-auto">
                {JSON.stringify(storeUser, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Supabase Auth Session */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Supabase Auth Session</h2>
          <div className="space-y-2">
            <p className="text-lg">
              <strong>Session:</strong>{' '}
              {session ? (
                <span className="text-green-600">✅ Exists</span>
              ) : (
                <span className="text-red-600">❌ Null</span>
              )}
            </p>
            <p className="text-lg">
              <strong>Auth User:</strong>{' '}
              {authUser ? (
                <span className="text-green-600">✅ Exists</span>
              ) : (
                <span className="text-red-600">❌ Null</span>
              )}
            </p>
            {authUser && (
              <>
                <p className="text-lg">
                  <strong>Email:</strong> {authUser.email}
                </p>
                <p className="text-lg">
                  <strong>ID:</strong> {authUser.id}
                </p>
                <p className="text-lg">
                  <strong>Email Confirmed:</strong>{' '}
                  {authUser.email_confirmed_at ? '✅ Yes' : '❌ No'}
                </p>
                <pre className="bg-gray-50 p-4 rounded mt-4 overflow-auto">
                  {JSON.stringify(authUser, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>

        {/* Database User Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Database User Profile</h2>
          <div className="space-y-2">
            <p className="text-lg">
              <strong>DB User:</strong>{' '}
              {dbUser ? (
                <span className="text-green-600">✅ Exists</span>
              ) : (
                <span className="text-red-600">❌ Null</span>
              )}
            </p>
            {dbUser && (
              <>
                <p className="text-lg">
                  <strong>Email:</strong> {dbUser.email}
                </p>
                <p className="text-lg">
                  <strong>Role:</strong> {dbUser.role}
                </p>
                <p className="text-lg">
                  <strong>Is Active:</strong>{' '}
                  <span className={dbUser.is_active ? 'text-green-600' : 'text-red-600'}>
                    {dbUser.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </p>
                <p className="text-lg">
                  <strong>Organization ID:</strong> {dbUser.organization_id || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>Location ID:</strong> {dbUser.location_id || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>Is Super Admin:</strong>{' '}
                  {dbUser.is_super_admin ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-lg">
                  <strong>PIN:</strong> {dbUser.pin || 'Not Set'}
                </p>
                <p className="text-lg">
                  <strong>PIN Enabled:</strong> {dbUser.pin_enabled ? '✅ Yes' : '❌ No'}
                </p>
                <pre className="bg-gray-50 p-4 rounded mt-4 overflow-auto">
                  {JSON.stringify(dbUser, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-800">Diagnosis</h2>
          <div className="space-y-2">
            {!authUser && <p className="text-yellow-800">⚠️ No Supabase Auth session - User is not logged in</p>}
            {authUser && !dbUser && (
              <p className="text-red-600">
                ❌ Auth user exists but database profile is missing - Run: node scripts/fix-admin-login.js
              </p>
            )}
            {dbUser && !dbUser.is_active && (
              <p className="text-red-600">
                ❌ User profile is INACTIVE - Run: node scripts/activate-admin.js
              </p>
            )}
            {dbUser && dbUser.is_active && !storeUser && (
              <p className="text-red-600">
                ❌ User is active but Zustand store is not updated - Try refreshing the page
              </p>
            )}
            {dbUser && dbUser.is_active && storeUser && (
              <p className="text-green-600">✅ Everything looks good! User should be able to access the system.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
