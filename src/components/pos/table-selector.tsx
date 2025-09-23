'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button
} from '@mui/material'
import {
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface Table {
  id: string
  name: string
  capacity: number
  section: string | null
  status: 'available' | 'occupied' | 'cleaning' | 'reserved'
}

interface TableSelectorProps {
  open: boolean
  onClose: () => void
  onSelectTable: (tableId: string, tableName: string) => void
  selectedTableId?: string | null
}

export function TableSelector({ open, onClose, onSelectTable, selectedTableId }: TableSelectorProps) {
  const { user } = useAuthStore()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && user?.locationId) {
      loadTables()
    }
  }, [open, user?.locationId])

  const loadTables = async () => {
    if (!user?.locationId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('location_id', user.locationId)
        .order('name')

      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success'
      case 'occupied':
        return 'error'
      case 'cleaning':
        return 'warning'
      case 'reserved':
        return 'info'
      default:
        return 'default'
    }
  }

  const handleTableSelect = (table: Table) => {
    if (table.status === 'available' || table.status === 'reserved') {
      onSelectTable(table.id, table.name)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <TableIcon />
            <Typography variant="h6">Select Table</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2}>
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id
            const isSelectable = table.status === 'available' || table.status === 'reserved'
            
            return (
              <Grid item xs={6} sm={4} md={3} key={table.id}>
                <Card
                  sx={{
                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    opacity: isSelectable ? 1 : 0.6,
                    transition: 'all 0.2s',
                    '&:hover': isSelectable ? {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    } : {}
                  }}
                  onClick={() => handleTableSelect(table)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ mb: 1 }}>
                      <TableIcon 
                        sx={{ 
                          fontSize: 40,
                          color: isSelected ? 'primary.main' : 'text.secondary'
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {table.name}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={1}>
                      <PeopleIcon fontSize="small" />
                      <Typography variant="body2">
                        {table.capacity} seats
                      </Typography>
                    </Box>
                    
                    {table.section && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        {table.section}
                      </Typography>
                    )}
                    
                    <Chip
                      label={table.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(table.status) as any}
                      variant={isSelected ? 'filled' : 'outlined'}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
        
        {tables.length === 0 && !isLoading && (
          <Box textAlign="center" py={4}>
            <TableIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No tables available
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}