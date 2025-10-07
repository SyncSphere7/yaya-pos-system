  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category_id: '',
    sku: '',
    image_url: '',
    is_active: true
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    department_id: '',
    is_active: true
  })

  useEffect(() => {
    if (user?.locationId) {
      loadData()
    }
  }, [user?.locationId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadDepartments(),
        loadCategories(),
        loadProducts()
      ])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDepartments = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('departments')
      .select('id, name, color')
      .eq('location_id', user.locationId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    setDepartments(data || [])
  }

  const loadCategories = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('location_id', user.locationId)
      .order('sort_order')

    if (error) throw error
    setCategories(data || [])
  }

  const loadProducts = async () => {
    if (!user?.locationId) return

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('location_id', user.locationId)
      .order('name')

    if (error) throw error
    setProducts(data || [])
  }

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false
    if (selectedDepartment !== 'all') {
      const productCategory = categories.find(c => c.id === p.category_id)
      if (!productCategory || productCategory.department_id !== selectedDepartment) return false
    }
    return true
  })

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        category_id: product.category_id || '',
        sku: product.sku || '',
        image_url: product.image_url || '',
        is_active: product.is_active
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        price: '',
        cost: '',
        category_id: '',
        sku: '',
        image_url: '',
        is_active: true
      })
    }
    setProductDialogOpen(true)
    setError(null)
  }

  const handleSaveProduct = async () => {
    if (!user?.locationId) return

    try {
      setError(null)

      const productData = {
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        cost: parseFloat(productForm.cost),
        category_id: productForm.category_id || null,
        sku: productForm.sku || null,
        image_url: productForm.image_url || null,
        is_active: productForm.is_active,
        location_id: user.locationId
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        setSuccess('Product updated successfully')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
        setSuccess('Product created successfully')
      }

      await loadProducts()
      setProductDialogOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      setSuccess('Product deleted successfully')
      await loadProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        department_id: category.department_id,
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        department_id: departments[0]?.id || '',
        is_active: true
      })
    }
    setCategoryDialogOpen(true)
    setError(null)
  }

  const handleSaveCategory = async () => {
    if (!user?.locationId) return

    try {
      setError(null)

      const categoryData = {
        name: categoryForm.name,
        department_id: categoryForm.department_id,
        is_active: categoryForm.is_active,
        location_id: user.locationId,
        sort_order: categories.length
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
        setSuccess('Category updated successfully')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)

        if (error) throw error
        setSuccess('Category created successfully')
      }

      await loadCategories()
      setCategoryDialogOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your products and categories
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => handleOpenCategoryDialog()}
          >
            Add Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProductDialog()}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  setSelectedCategory('all')
                }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories
                  .filter(c => selectedDepartment === 'all' || c.department_id === selectedDepartment)
                  .map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!product.image_url && <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
              </CardMedia>
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    {product.name}
                  </Typography>
                  <Chip
                    label={product.is_active ? 'Active' : 'Inactive'}
                    color={product.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {product.description || 'No description'}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>
                  {formatCurrency(product.price)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Category: {(product.categories as any)?.name || 'Uncategorized'}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenProductDialog(product)}
                  fullWidth
                >
                  Edit
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}

        {filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Restaurant sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start adding products to your menu
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenProductDialog()}
              >
                Add First Product
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Product Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  fullWidth
                  required
                  InputProps={{ startAdornment: 'KES ' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Cost"
                  type="number"
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: 'KES ' }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={productForm.category_id}
                label="Category"
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="SKU"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              fullWidth
            />
            <TextField
              label="Image URL"
              value={productForm.image_url}
              onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              fullWidth
              placeholder="https://example.com/image.jpg"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={categoryForm.department_id}
                label="Department"
                onChange={(e) => setCategoryForm({ ...categoryForm, department_id: e.target.value })}
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Category as CategoryIcon,
  Restaurant,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number
  category_id: string | null
  image_url: string | null
  is_active: boolean
  sku: string | null
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
  department_id: string
  is_active: boolean
}

interface Department {
  id: string
  name: string
  color: string
}

export default function MenuPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <MenuManagement />
    </RoleGuard>
  )
}

function MenuManagement() {
  const { user } = useAuthStore()
  const [currentTab, setCurrentTab] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

