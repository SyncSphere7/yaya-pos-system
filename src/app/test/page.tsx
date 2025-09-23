'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import { 
  CheckCircle, 
  Error, 
  Refresh,
  Database,
  Cloud
} from '@mui/icons-material'

interface TestResult {
  status: 'success' | 'error'
  message: string
  connection?: {
    url: string
    connected: boolean
  }
  database?: {
    tablesExist: boolean
    tableStatus: Record<string, boolean>
    missingTables: string[]
  }
  error?: string
  timestamp: string
}

export default function TestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runConnectionTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-connection')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Failed to run connection test',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runConnectionTest()
  }, [])

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          YaYa POS - Connection Test
        </Typography>
        
        <Button
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={runConnectionTest}
          disabled={isLoading}
          sx={{ mb: 3 }}
        >
          {isLoading ? 'Testing...' : 'Run Test'}
        </Button>

        {testResult && (
          <Card>
            <CardContent>
              <Alert 
                severity={testResult.status === 'success' ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                {testResult.message}
              </Alert>

              {testResult.connection && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Cloud sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Connection Status
                  </Typography>
                  <Chip 
                    label={testResult.connection.connected ? 'Connected' : 'Disconnected'}
                    color={testResult.connection.connected ? 'success' : 'error'}
                  />
                </Box>
              )}

              {testResult.database && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Database sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Database Tables
                  </Typography>
                  
                  <Chip 
                    label={testResult.database.tablesExist ? 'All Tables Exist' : 'Missing Tables'}
                    color={testResult.database.tablesExist ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  />

                  <List>
                    {Object.entries(testResult.database.tableStatus).map(([table, exists]) => (
                      <ListItem key={table}>
                        <ListItemIcon>
                          {exists ? 
                            <CheckCircle color="success" /> : 
                            <Error color="error" />
                          }
                        </ListItemIcon>
                        <ListItemText 
                          primary={table}
                          secondary={exists ? 'Table exists' : 'Table missing'}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {testResult.database.missingTables.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Missing tables: {testResult.database.missingTables.join(', ')}
                      <br />
                      Run the SQL schema from supabase-schema.sql in your Supabase SQL editor.
                    </Alert>
                  )}
                </Box>
              )}

              {testResult.status === 'success' && testResult.database?.tablesExist && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  🎉 Ready to test! Your Supabase connection is working.
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" href="/" sx={{ mr: 2 }}>
                      Go to Home
                    </Button>
                    <Button variant="outlined" href="/pos">
                      Test POS
                    </Button>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  )
}