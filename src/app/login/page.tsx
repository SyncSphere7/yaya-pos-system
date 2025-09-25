'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar
} from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Person as StaffIcon
} from '@mui/icons-material'

export default function LoginPage() {
  const router = useRouter()

  const handleAdminLogin = () => {
    router.push('/login/admin')
  }

  const handleStaffLogin = () => {
    router.push('/login/staff')
  }

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
            onClick={handleAdminLogin}
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
            onClick={handleStaffLogin}
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