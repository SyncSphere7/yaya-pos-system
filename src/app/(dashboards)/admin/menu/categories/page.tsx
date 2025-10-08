'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CategoriesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <CategoriesManagement />
    </RoleGuard>
  )
}

function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('categories').insert({ name: formData.name, description: formData.description })
    if (error) alert('Error: ' + error.message)
    else {
      setShowModal(false)
      setFormData({ name: '', description: '' })
      loadCategories()
    }
  }

  const deleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await supabase.from('categories').delete().eq('id', id)
      loadCategories()
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 mt-1">Manage menu categories</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Add Category</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{cat.description || 'No description'}</p>
            <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:underline text-sm">Delete</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Category</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#D4AF37] text-black py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
