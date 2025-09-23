'use client'

import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  Chip
} from '@mui/material'
import {
  Backspace as BackspaceIcon
} from '@mui/icons-material'

interface PinLoginProps {
  onLogin: (pin: string) => Promise<void>
  loading?: boolean
  error?: string | null
  onBack?: () => void
}

export function PinLogin({ onLogin, loading = false, error, onBack }: PinLoginProps) {
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNumberClick = (number: string) => {
    if (pin.length < 4) {
      const newPin = pin + number
      setPin(newPin)
      
      if (newPin.length === 4) {
        handleSubmit(newPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  const handleSubmit = async (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 4) return
    
    setIsSubmitting(true)
    try {
      await onLogin(pinToSubmit)
    } finally {
      setIsSubmitting(false)
      setPin('')
    }
  }

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

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
          py: 2,
          bgcolor: 'white'
        }}
      >
        <Box sx={{ mb: 1 }}>
          <img 
            src="/yaya-logo.png" 
            alt="Yaya Xtra Residence Logo" 
            style={{ 
              height: '40px', 
              width: 'auto'
            }} 
          />
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
          Staff Login
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your 4-digit PIN
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 6,
            maxWidth: 900,
            width: '100%',
            alignItems: 'center'
          }}
        >
          {/* Left Side - PIN Display */}
          <Box
            sx={{
              flex: 1,
              textAlign: 'center',
              bgcolor: 'white',
              borderRadius: 3,
              p: 4
            }}
          >
            <Typography variant="h5" fontWeight={600} sx={{ color: '#1a1a1a', mb: 3 }}>
              Enter PIN
            </Typography>
            
            {/* PIN Dots */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 3,
                mb: 3
              }}
            >
              {[0, 1, 2, 3].map((index) => (
                <Box
                  key={index}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: '3px solid',
                    borderColor: pin.length > index ? '#1a1a1a' : 'grey.300',
                    bgcolor: pin.length > index ? '#1a1a1a' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pin.length > index && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: 'white'
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Status */}
            {(loading || isSubmitting) && (
              <Chip
                label="Authenticating..."
                sx={{
                  bgcolor: '#1a1a1a',
                  color: 'white',
                  fontSize: '1rem',
                  height: 40
                }}
              />
            )}
          </Box>

          {/* Right Side - Number Pad */}
          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              p: 4
            }}
          >
            <Typography variant="h5" fontWeight={600} sx={{ color: '#1a1a1a', mb: 3, textAlign: 'center' }}>
              Touch to Enter
            </Typography>
            
            {/* Number Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {numbers.slice(0, 9).map((number) => (
                <Grid item xs={4} key={number}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      height: 70,
                      fontSize: '1.8rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: '#1a1a1a',
                      color: '#1a1a1a',
                      '&:hover': {
                        borderColor: '#1a1a1a',
                        bgcolor: 'rgba(26, 26, 26, 0.04)',
                        transform: 'scale(1.05)'
                      }
                    }}
                    onClick={() => handleNumberClick(number)}
                    disabled={loading || isSubmitting}
                  >
                    {number}
                  </Button>
                </Grid>
              ))}
              
              {/* Bottom row: Back, 0, Backspace */}
              <Grid item xs={4}>
                {onBack && (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      height: 70,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      color: 'grey.600',
                      borderColor: 'grey.400',
                      '&:hover': {
                        borderColor: 'grey.600',
                        bgcolor: 'grey.50'
                      }
                    }}
                    onClick={onBack}
                    disabled={loading || isSubmitting}
                  >
                    Back
                  </Button>
                )}
              </Grid>
              
              <Grid item xs={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    height: 70,
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a',
                    '&:hover': {
                      borderColor: '#1a1a1a',
                      bgcolor: 'rgba(26, 26, 26, 0.04)',
                      transform: 'scale(1.05)'
                    }
                  }}
                  onClick={() => handleNumberClick('0')}
                  disabled={loading || isSubmitting}
                >
                  0
                </Button>
              </Grid>
              
              <Grid item xs={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    height: 70,
                    borderRadius: 2,
                    color: 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      bgcolor: 'error.light',
                      transform: 'scale(1.05)'
                    }
                  }}
                  onClick={handleBackspace}
                  disabled={pin.length === 0 || loading || isSubmitting}
                >
                  <BackspaceIcon sx={{ fontSize: '1.5rem' }} />
                </Button>
              </Grid>
            </Grid>

            {/* Login Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleSubmit()}
              disabled={pin.length !== 4 || loading || isSubmitting}
              sx={{
                height: 60,
                fontSize: '1.2rem',
                fontWeight: 600,
                bgcolor: '#1a1a1a',
                color: 'white',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#2d2d2d'
                },
                '&:disabled': {
                  bgcolor: 'grey.300'
                }
              }}
            >
              {loading || isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}