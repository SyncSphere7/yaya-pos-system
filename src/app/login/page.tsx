'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  Avatar
} from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Person as StaffIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { PinLogin } from '@/components/auth/pin-login'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'

type LoginMode = 'select' | 'admin' | 'staff'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signInWithPin } = useAuthStore()
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { user, error: loginError } = await signIn(email, password)
    
    if (loginError) {
      setError(loginError)
      setLoading(false)
      return
    }

    if (user) {
      if (user.role === 'admin' || user.role === 'manager') {
        router.push('/admin')
      } else {
        router.push('/pos')
      }
    }
    
    setLoading(false)
  }

  const handleStaffLogin = async (pin: string) => {
    setError(null)
    const { user, error: loginError } = await signInWithPin(pin)
    
    if (loginError) {
      setError(loginError)
      throw new Error(loginError)
    }

    if (user) {
      if (user.role === 'kitchen') {
        router.push('/kitchen')
      } else {
        router.push('/pos')
      }
    }
  }

  // Role Selection Screen
  if (mode === 'select') {
    return (
      <Box
        sx={{
          height: '100vh',
          bgcolor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            bgcolor: 'white'
          }}
        >
          <Box sx={{ mb: 1 }}>
            <img 
              src="/yaya-logo.png" 
              alt="Yaya Xtra Residence Logo" 
              style={{ 
                height: '50px', 
                width: 'auto'
              }} 
            />
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
            Yaya Xtra Residence POS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose your login method
          </Typography>
        </Box>

        {/* Cards Container */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 6,
              maxWidth: 800,
              width: '100%'
            }}
          >
            {/* Admin Login Card */}
            <Card
              elevation={0}
              sx={{
                flex: 1,
                cursor: 'pointer',
                bgcolor: 'white',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: 'white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }
              }}
              onClick={() => setMode('admin')}
            >
              <CardContent sx={{ 
                textAlign: 'center', 
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320
              }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 3,
                    bgcolor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  <AdminIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                  Admin Login
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ 
                  lineHeight: 1.5,
                  textAlign: 'center'
                }}>
                  Full system access with email and password
                </Typography>
              </CardContent>
            </Card>

            {/* Staff Login Card */}
            <Card
              elevation={0}
              sx={{
                flex: 1,
                cursor: 'pointer',
                bgcolor: 'white',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: 'white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }
              }}
              onClick={() => setMode('staff')}
            >
              <CardContent sx={{ 
                textAlign: 'center', 
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320
              }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 3,
                    bgcolor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  <StaffIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                  Staff Login
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ 
                  lineHeight: 1.5,
                  textAlign: 'center'
                }}>
                  Quick 4-digit PIN access for waiters and kitchen staff
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    )
  }

  // Admin Login Screen
  if (mode === 'admin') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            borderRadius: 4,
            bgcolor: 'white'
          }}
        >
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img 
                src="/yaya-logo.png" 
                alt="Yaya Xtra Residence Logo" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'contain'
                }} 
              />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Admin Login
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email and password
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleAdminLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<BackIcon />}
                onClick={() => setMode('select')}
                disabled={loading}
              >
                Back
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  height: 50,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  bgcolor: '#1a1a1a',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#2d2d2d'
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    )
  }

  // Staff PIN Login Screen
  return (
    <PinLogin
      onLogin={handleStaffLogin}
      loading={loading}
      error={error}
      onBack={() => setMode('select')}
    />
  )
}