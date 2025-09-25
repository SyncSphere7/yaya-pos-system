'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Avatar,
  IconButton
} from '@mui/material'
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const steps = ['Organization Details', 'Admin Account', 'Complete Setup']

export default function SetupPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [orgData, setOrgData] = useState({
    name: '',
    locationName: '',
    address: '',
    phone: '',
    logo: null as File | null,
    logoPreview: ''
  })

  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [setupDepartments, setSetupDepartments] = useState({
    restaurant: true,
    bar: true,
    fumes: true
  })

  const handleNext = async () => {
    setError(null)

    if (activeStep === 0) {
      if (!orgData.name || !orgData.locationName || !orgData.address) {
        setError('Please fill in all required fields')
        return
      }
      setActiveStep(1)
    } else if (activeStep === 1) {
      if (!adminData.firstName || !adminData.lastName || !adminData.email || !adminData.password) {
        setError('Please fill in all required fields')
        return
      }
      if (adminData.password !== adminData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (adminData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      await handleSetup()
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Logo file size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setOrgData({ 
          ...orgData, 
          logo: file, 
          logoPreview: e.target?.result as string 
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setOrgData({ ...orgData, logo: null, logoPreview: '' })
  }

  const uploadLogo = async (orgId: string): Promise<string | null> => {
    if (!orgData.logo) return null
    
    try {
      const fileExt = orgData.logo.name.split('.').pop()
      const fileName = `${orgId}/logo.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, orgData.logo, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        console.warn('Logo upload failed:', error.message)
        return null // Continue setup without logo
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error) {
      console.warn('Logo upload error:', error)
      return null // Continue setup without logo
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      
      // Check if email confirmation is required
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        throw new Error('Please check your email and confirm your account before proceeding. Then try logging in.')
      }

      // Create organization first to get ID
      const { data: orgResult, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgData.name
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Upload logo if provided (optional)
      let logoUrl = null
      if (orgData.logo) {
        logoUrl = await uploadLogo(orgResult.id)
        
        // Update organization with logo URL if upload succeeded
        if (logoUrl) {
          const { error: logoUpdateError } = await supabase
            .from('organizations')
            .update({ logo_url: logoUrl })
            .eq('id', orgResult.id)
          
          if (logoUpdateError) {
            console.warn('Logo URL update failed:', logoUpdateError.message)
            // Continue setup even if logo URL update fails
          }
        }
      }

      const { data: locationResult, error: locationError } = await supabase
        .from('locations')
        .insert({
          organization_id: orgResult.id,
          name: orgData.locationName,
          address: orgData.address,
          phone: orgData.phone
        })
        .select()
        .single()

      if (locationError) throw locationError

      // Create user first (required for RLS policies)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          organization_id: orgResult.id,
          location_id: locationResult.id,
          email: adminData.email,
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          role: 'admin',
          is_active: true
        })

      if (userError) throw userError

      // Now create departments (user exists for RLS)
      const departments = []
      if (setupDepartments.restaurant) {
        departments.push({
          location_id: locationResult.id,
          name: 'Restaurant',
          description: 'Full meals and dining experience',
          color: '#1a1a1a',
          sort_order: 1
        })
      }
      if (setupDepartments.bar) {
        departments.push({
          location_id: locationResult.id,
          name: 'Bar',
          description: 'Alcoholic beverages and bar service',
          color: '#1a1a1a',
          sort_order: 2
        })
      }
      if (setupDepartments.fumes) {
        departments.push({
          location_id: locationResult.id,
          name: 'Fumes',
          description: 'Hookah and smoking lounge',
          color: '#1a1a1a',
          sort_order: 3
        })
      }

      if (departments.length > 0) {
        const { error: deptError } = await supabase
          .from('departments')
          .insert(departments)

        if (deptError) throw deptError
      }

      setActiveStep(2)
    } catch (error: any) {
      setError(error.message || 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: 'white'
          }}
        >
          <Box textAlign="center" mb={4}>
            <Box sx={{ mb: 3 }}>
              <img 
                src="/yaya-logo.png" 
                alt="Yaya Xtra Residence Logo" 
                style={{ 
                  height: '80px', 
                  width: 'auto'
                }} 
              />
            </Box>
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{
              color: '#1a1a1a'
            }}>
              Setup Yaya Xtra Residence POS
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Let&apos;s get your restaurant system ready
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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

          {activeStep === 0 && (
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                  <Typography variant="h5" fontWeight={600}>
                    Organization Details
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      required
                      placeholder="e.g., YaYa Restaurant & Bar"
                    />
                  </Grid>
                  
                  {/* Logo Upload */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Business Logo (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {orgData.logoPreview ? (
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            src={orgData.logoPreview}
                            sx={{ width: 80, height: 80, borderRadius: 2 }}
                            variant="rounded"
                          />
                          <IconButton
                            size="small"
                            onClick={handleRemoveLogo}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Avatar
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: 2,
                            border: '2px dashed #ccc',
                            bgcolor: 'grey.50'
                          }}
                          variant="rounded"
                        >
                          <UploadIcon sx={{ fontSize: 32, color: 'grey.400' }} />
                        </Avatar>
                      )}
                      
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          sx={{ mb: 1 }}
                        >
                          Upload Logo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          PNG, JPG up to 5MB. Will appear on receipts and POS interface.
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Location Name"
                      value={orgData.locationName}
                      onChange={(e) => setOrgData({ ...orgData, locationName: e.target.value })}
                      required
                      placeholder="e.g., Downtown Branch"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={orgData.phone}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                      placeholder="e.g., +256 700 123 456"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={orgData.address}
                      onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                      required
                      multiline
                      rows={2}
                      placeholder="Full business address"
                    />
                  </Grid>
                </Grid>

                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Select Departments to Setup
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setupDepartments.restaurant}
                            onChange={(e) => setSetupDepartments({ ...setupDepartments, restaurant: e.target.checked })}
                          />
                        }
                        label="Restaurant"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setupDepartments.bar}
                            onChange={(e) => setSetupDepartments({ ...setupDepartments, bar: e.target.checked })}
                          />
                        }
                        label="Bar"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setupDepartments.fumes}
                            onChange={(e) => setSetupDepartments({ ...setupDepartments, fumes: e.target.checked })}
                          />
                        }
                        label="Fumes (Hookah)"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <PersonIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                  <Typography variant="h5" fontWeight={600}>
                    Create Admin Account
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={adminData.firstName}
                      onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={adminData.lastName}
                      onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                      placeholder="admin@yourbusiness.com"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      required
                      helperText="Minimum 6 characters"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type="password"
                      value={adminData.confirmPassword}
                      onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Setup Complete!
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                  Your Yaya Xtra Residence POS system is ready to use
                </Typography>
                
                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2, mb: 4 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>What's been created:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✓ Organization: {orgData.name}<br/>
                    ✓ Location: {orgData.locationName}<br/>
                    ✓ Admin Account: {adminData.email}<br/>
                    ✓ Logo: {orgData.logo ? 'Uploaded' : 'Not provided'}<br/>
                    ✓ Departments: {Object.entries(setupDepartments).filter(([_, enabled]) => enabled).map(([dept]) => dept).join(', ')}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleComplete}
                  sx={{
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#2d2d2d'
                    }
                  }}
                >
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          )}

          {activeStep < 2 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#2d2d2d'
                  }
                }}
              >
                {loading ? 'Setting up...' : activeStep === 1 ? 'Complete Setup' : 'Next'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  )
}