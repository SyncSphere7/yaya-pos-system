'use client'

import React from 'react'
import { Box, Typography, Button, Paper, Container } from '@mui/material'
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            width: '100%'
          }}
        >
          <ErrorIcon
            sx={{
              fontSize: 64,
              color: 'error.main',
              mb: 2
            }}
          />
          
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an unexpected error. Please try refreshing the page.
          </Typography>
          
          {error && process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                mb: 3,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto'
              }}
            >
              <Typography variant="body2" color="error">
                {error.message}
              </Typography>
              {error.stack && (
                <Typography variant="caption" component="pre" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  {error.stack}
                </Typography>
              )}
            </Box>
          )}
          
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={resetError}
              size="large"
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="large"
            >
              Reload Page
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error:', error, errorInfo)
    // You can also send to error reporting service here
  }
}