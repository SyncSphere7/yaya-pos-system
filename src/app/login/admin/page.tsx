'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert
} from '@mui/material'
import {
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/auth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn } = useAuthStore()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleBack = () => {
    router.push('/login')
  }

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

        <Box component="form" onSubmit={handleLogin}>
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
              onClick={handleBack}
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