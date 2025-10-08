'use client'

import { useState, useEffect } from 'react'
import { Box, Paper, Typography, Button, Grid, Card, CardContent, CardMedia, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel } from '@mui/material'
import { Add, Edit, Delete, GridView, ViewList, Search } from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/lib/utils'

export default function MenuPage() {
  const { user } = useAuthStore()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [products, setProducts] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    is_active: true
  })

  useEffect(() => {
    loadProducts()
  }, [user?.locationId])

  const loadProducts = async () => {
    if (!user?.locationId) return
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('location_id', user.locationId)
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const handleSave = async () => {
    if (selectedProduct) {
      await supabase.from('products').update(form).eq('id', selectedProduct.id)
    } else {
      await supabase.from('products').insert({ ...form, location_id: user?.locationId })
    }
    setDialogOpen(false)
    loadProducts()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
          Menu Management
        </Typography>
        <Box display="flex" gap={2}>
          <IconButton onClick={() => setView('grid')} sx={{ bgcolor: view === 'grid' ? '#D4AF37' : 'white' }}>
            <GridView />
          </IconButton>
          <IconButton onClick={() => setView('list')} sx={{ bgcolor: view === 'list' ? '#D4AF37' : 'white' }}>
            <ViewList />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedProduct(null)
              setForm({ name: '', price: '', description: '', category: '', is_active: true })
              setDialogOpen(true)
            }}
            sx={{ bgcolor: '#D4AF37', color: '#1a1a1a', fontWeight: 600, '&:hover': { bgcolor: '#C19B2E' } }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Products Grid */}
      {view === 'grid' ? (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card elevation={24} sx={{ borderRadius: 4 }}>
                <CardMedia
                  component="div"
                  sx={{ height: 180, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Typography variant="h4" color="text.secondary">🍽️</Typography>
                </CardMedia>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#D4AF37" gutterBottom>
                    {formatCurrency(product.price)}
                  </Typography>
                  <Chip
                    label={product.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={product.is_active ? 'success' : 'default'}
                    sx={{ mb: 2 }}
                  />
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedProduct(product)
                        setForm(product)
                        setDialogOpen(true)
                      }}
                      sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(product.id)}
                      sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={24} sx={{ borderRadius: 4, bgcolor: 'white', p: 3 }}>
          {products.map((product) => (
            <Box key={product.id} display="flex" justifyContent="space-between" alignItems="center" py={2} borderBottom="1px solid #eee">
              <Box>
                <Typography variant="h6" fontWeight={700}>{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{product.description}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" fontWeight={700} color="#D4AF37">
                  {formatCurrency(product.price)}
                </Typography>
                <Chip label={product.is_active ? 'Active' : 'Inactive'} size="small" color={product.is_active ? 'success' : 'default'} />
                <IconButton size="small" onClick={() => { setSelectedProduct(product); setForm(product); setDialogOpen(true); }}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(product.id)} sx={{ color: '#EF4444' }}>
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          {selectedProduct ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} label="Category">
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="drinks">Drinks</MenuItem>
              <MenuItem value="hookah">Hookah</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
            label="Active"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderColor: '#1a1a1a', color: '#1a1a1a' }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#D4AF37', color: '#1a1a1a', '&:hover': { bgcolor: '#C19B2E' } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
