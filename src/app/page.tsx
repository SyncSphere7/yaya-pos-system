'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Button,
  Card,
  CardContent,
  Stack,
  Avatar,
  Divider
} from '@mui/material'
import { 
  Restaurant as RestaurantIcon,
  LocalBar as BarIcon,
  CloudQueue as FumesIcon,
  TouchApp,
  Speed,
  Security,
  Analytics,
  Payment,
  ArrowForward,
  Business as BusinessIcon,
  Login as LoginIcon
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [hasOrganizations, setHasOrganizations] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSetup = async () => {
      if (isLoading) return

      // Check if organizations exist (for display purposes only)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
      
      setHasOrganizations(orgs && orgs.length > 0)
    }

    // No automatic redirects - users choose their path
    checkSetup()
  }, [isLoading])

  const handleSetupBusiness = () => {
    router.push('/setup')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  if (isLoading || hasOrganizations === null) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#1a1a1a'
        }}
      >
        <Box textAlign="center" sx={{ color: 'white' }}>
          <img 
            src="/yaya-logo.png" 
            alt="Yaya Xtra Residence Logo" 
            style={{ 
              height: '80px', 
              width: 'auto',
              marginBottom: '24px'
            }} 
          />
          <Typography variant="h6">Loading Yaya Xtra Residence POS...</Typography>
        </Box>
      </Box>
    )
  }

  const departments = [
    {
      icon: <RestaurantIcon sx={{ fontSize: 48 }} />,
      title: 'Restaurant',
      description: 'Full dining experience with appetizers, mains, desserts, and table service management.'
    },
    {
      icon: <BarIcon sx={{ fontSize: 48 }} />,
      title: 'Bar',
      description: 'Complete bar service with beers, spirits, wines, cocktails, and beverage inventory.'
    },
    {
      icon: <FumesIcon sx={{ fontSize: 48 }} />,
      title: 'Fumes',
      description: 'Hookah lounge operations with shisha flavors, smoking accessories, and lounge management.'
    }
  ]

  const features = [
    {
      icon: <TouchApp />,
      title: 'Touch-Optimized',
      description: 'Designed for tablets and touchscreens with large tap targets'
    },
    {
      icon: <Speed />,
      title: 'Lightning Fast',
      description: 'Real-time order processing and instant synchronization'
    },
    {
      icon: <Security />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control'
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Comprehensive reporting and business intelligence'
    },
    {
      icon: <Payment />,
      title: 'Multiple Payments',
      description: 'Cash, cards, MTN Momo, AirtelPay integration'
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Box sx={{ mb: 4 }}>
              <img 
                src="/yaya-logo.png" 
                alt="Yaya Xtra Residence Logo" 
                style={{ 
                  height: '120px', 
                  width: 'auto'
                }} 
              />
            </Box>
            <Typography 
              variant="h1" 
              component="h1" 
              fontWeight={800} 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '4rem' },
                mb: 3,
                color: 'white'
              }}
            >
              Yaya Xtra Residence POS
            </Typography>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 4, 
                fontWeight: 400,
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: 'white'
              }}
            >
              World-Class Restaurant & Bar Management
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6, 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: 'white'
              }}
            >
              Complete hospitality solution for Restaurant, Bar, and Fumes operations. 
              Touch-optimized, lightning-fast, and built for the modern hospitality industry.
            </Typography>
            {/* Main Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: 800,
                mx: 'auto'
              }}
            >
              {/* Setup New Business Card */}
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  bgcolor: 'white',
                  border: '2px solid white',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  minWidth: { xs: '100%', md: 300 },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }
                }}
                onClick={handleSetupBusiness}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200
                }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      bgcolor: '#1a1a1a',
                      color: 'white'
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                    Setup New Business
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ 
                    lineHeight: 1.5,
                    textAlign: 'center'
                  }}>
                    First time? Create your restaurant and admin account
                  </Typography>
                </CardContent>
              </Card>

              {/* Login to Existing System Card */}
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  bgcolor: 'white',
                  border: '2px solid white',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  minWidth: { xs: '100%', md: 300 },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }
                }}
                onClick={handleLogin}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200
                }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      bgcolor: '#1a1a1a',
                      color: 'white'
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                    Login to System
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ 
                    lineHeight: 1.5,
                    textAlign: 'center'
                  }}>
                    {hasOrganizations ? 'Access your existing POS system' : 'Staff and admin login'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Departments Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography 
            variant="h2" 
            component="h2" 
            fontWeight={700}
            sx={{ 
              mb: 3,
              color: '#1a1a1a'
            }}
          >
            Three Departments, One System
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}
          >
            Manage your entire hospitality business with specialized modules for each operation
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 10, justifyContent: 'center' }}>
          {departments.map((dept, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 4,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)'
                  }
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      bgcolor: '#1a1a1a',
                      color: 'white'
                    }}
                  >
                    {dept.icon}
                  </Avatar>
                  <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
                    {dept.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {dept.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 8 }} />

        {/* Features Grid */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Why Choose Yaya Xtra Residence POS?
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Built for the modern hospitality industry
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  '&:hover': {
                    bgcolor: 'rgba(26, 26, 26, 0.05)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box 
        sx={{ 
          bgcolor: '#f8fafc',
          py: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 8 },
              textAlign: 'center',
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <Typography 
              variant="h2" 
              component="h3" 
              fontWeight={700} 
              gutterBottom
              sx={{
                color: '#1a1a1a'
              }}
            >
              Ready to Transform Your Business?
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: 6, 
                maxWidth: '600px', 
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              {hasOrganizations 
                ? 'Your POS system is ready. Login to start processing orders and managing your business.' 
                : 'Get started with your restaurant POS system. Setup takes less than 5 minutes.'}
            </Typography>
            
            <Stack spacing={2} alignItems="center">
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                justifyContent="center"
                alignItems="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSetupBusiness}
                  endIcon={<BusinessIcon />}
                  sx={{
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    px: 6,
                    py: 2.5,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    minWidth: 250,
                    '&:hover': {
                      bgcolor: '#2d2d2d',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Setup New Business
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleLogin}
                  endIcon={<LoginIcon />}
                  sx={{
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a',
                    px: 6,
                    py: 2.5,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    minWidth: 250,
                    '&:hover': {
                      borderColor: '#1a1a1a',
                      bgcolor: '#1a1a1a',
                      color: 'white',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Login to System
                </Button>
              </Stack>
              
              <Typography variant="body2" color="text.secondary">
                {hasOrganizations ? 'Choose setup for new business or login for existing system' : 'Get started with your POS system'}
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Yaya Xtra Residence POS
            </Typography>
            <Typography variant="body2" color="grey.400">
              Professional Point of Sale for Restaurants, Bars & Hookah Lounges
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}