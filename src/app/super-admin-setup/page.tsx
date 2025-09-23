'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { supabase } from '@/lib/supabase'

const SUPER_ADMIN_KEY = process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || 'YAYA_SUPER_2024'

export default function SuperAdminSetupPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Form data
  const [setupKey, setSetupKey] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')
  const [locationName, setLocationName] = useState('')

  useEffect(() => {
    checkExistingSuperAdmin()
  }, [])

  const checkExistingSuperAdmin = async () => {
    try {
      const { data: superAdmins } = await supabase
        .from('users')
        .select('id')
        .eq('is_super_admin', true)
        .limit(1)

      if (superAdmins && superAdmins.length > 0) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking super admin:', error)
    }
  }

  const validateSetupKey = () => {
    if (setupKey !== SUPER_ADMIN_KEY) {
      setError('Invalid setup key')
      return false
    }
    setError(null)
    setStep(1)
    return true
  }

  const createSuperAdmin = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          is_active: true
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Create location
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          name: locationName,
          organization_id: orgData.id,
          is_active: true
        })
        .select()
        .single()

      if (locationError) throw locationError

      // Create super admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: adminEmail,
            first_name: adminFirstName,
            last_name: adminLastName,
            role: 'super_admin',
            permissions: ['*'],
            is_super_admin: true,
            organization_id: orgData.id,
            location_id: locationData.id,
            is_active: true,
            pin_enabled: false
          })

        if (userError) throw userError

        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create super admin')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Verify Setup Key', 'Organization Details', 'Admin Account']

  if (success) {
    return (
      <Box
        sx={{
          height: '100vh',
          bgcolor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper sx={{ p: 6, maxWidth: 500, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            Setup Complete!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Super admin account created successfully. Redirecting to login...
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper sx={{ p: 6, maxWidth: 600, width: '100%' }}>
        <Box textAlign="center" mb={4}>
          <img 
            src="/yaya-logo.png" 
            alt="Yaya Xtra Residence Logo" 
            style={{ height: '60px', width: 'auto', marginBottom: '16px' }} 
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Super Admin Setup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Initialize your Yaya POS system
          </Typography>
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: Setup Key */}
        {step === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Enter Setup Key
            </Typography>
            <TextField
              fullWidth
              label="Setup Key"
              type="password"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              variant="contained"
              onClick={validateSetupKey}
              sx={{ mt: 3, height: 50, bgcolor: '#1a1a1a' }}
            >
              Verify Key
            </Button>
          </Box>
        )}

        {/* Step 1: Organization */}
        {step === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Organization Details
            </Typography>
            <TextField
              fullWidth
              label="Organization Name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Location Name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setStep(0)}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setStep(2)}
                fullWidth
                disabled={!organizationName || !locationName}
                sx={{ bgcolor: '#1a1a1a' }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Admin Account */}
        {step === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Super Admin Account
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                margin="normal"
                required
              />
            </Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setStep(1)}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={createSuperAdmin}
                fullWidth
                disabled={loading || !adminEmail || !adminPassword || !adminFirstName || !adminLastName}
                sx={{ bgcolor: '#1a1a1a' }}
              >
                {loading ? 'Creating...' : 'Create Super Admin'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )
}