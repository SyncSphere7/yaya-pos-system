'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip
} from '@mui/material'
import {
  Restaurant as RestaurantIcon,
  LocalBar as BarIcon,
  CloudQueue as FumesIcon
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface Department {
  id: string
  name: 'Restaurant' | 'Bar' | 'Fumes'
  description: string
  color: string
  isActive: boolean
}

interface DepartmentSelectorProps {
  selectedDepartment: string | null
  onSelectDepartment: (departmentId: string, departmentName: string) => void
}

export function DepartmentSelector({ selectedDepartment, onSelectDepartment }: DepartmentSelectorProps) {
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'dept-restaurant', name: 'Restaurant', description: 'Full meals and dining experience', color: '#3b82f6', isActive: true },
    { id: 'dept-bar', name: 'Bar', description: 'Alcoholic beverages and bar service', color: '#ef4444', isActive: true },
    { id: 'dept-fumes', name: 'Fumes', description: 'Hookah and smoking lounge', color: '#8b5cf6', isActive: true }
  ])

  useEffect(() => {
    if (user?.locationId) {
      loadDepartments()
    }
  }, [user?.locationId])

  const loadDepartments = async () => {
    if (!user?.locationId) return

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('location_id', user.locationId)
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.log('Using fallback departments')
        return
      }
      if (data && data.length > 0) {
        setDepartments(data)
      }
    } catch (error) {
      console.log('Using fallback departments')
    }
  }

  const getDepartmentIcon = (name: string) => {
    switch (name) {
      case 'Restaurant':
        return <RestaurantIcon sx={{ fontSize: 40 }} />
      case 'Bar':
        return <BarIcon sx={{ fontSize: 40 }} />
      case 'Fumes':
        return <FumesIcon sx={{ fontSize: 40 }} />
      default:
        return <RestaurantIcon sx={{ fontSize: 40 }} />
    }
  }

  const getDepartmentColor = (name: string) => {
    return '#1a1a1a' // All departments use black
  }

  return (
    <Box sx={{ p: 4, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: 3 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #4a5568 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Choose Your Department
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Select the service area to get started
        </Typography>
      </Box>
      
      <Grid container spacing={3} justifyContent="center">
        {departments.map((department) => {
          const isSelected = selectedDepartment === department.id
          const color = department.color || getDepartmentColor(department.name)
          
          return (
            <Grid item xs={12} sm={6} md={4} key={department.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: isSelected ? 'rgba(26, 26, 26, 0.05)' : '#ffffff',
                  border: isSelected ? '2px solid #1a1a1a' : '1px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: '#1a1a1a',
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }
                }}
                onClick={() => onSelectDepartment(department.id, department.name)}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: isSelected ? '#1a1a1a' : 'rgba(26, 26, 26, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.3s ease',
                      boxShadow: isSelected ? '0 8px 32px rgba(0,0,0,0.25)' : 'none'
                    }}
                  >
                    <Box sx={{ color: isSelected ? 'white' : '#1a1a1a', fontSize: '2rem' }}>
                      {getDepartmentIcon(department.name)}
                    </Box>
                  </Box>
                  
                  <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: isSelected ? '#1a1a1a' : 'text.primary' }}>
                    {department.name}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {department.description}
                  </Typography>
                  
                  {isSelected && (
                    <Chip
                      label="✓ Selected"
                      sx={{ 
                        bgcolor: '#1a1a1a', 
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
      
      {departments.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No departments available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact your administrator to set up departments
          </Typography>
        </Box>
      )}
    </Box>
  )
}