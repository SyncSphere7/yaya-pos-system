'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

export default function ModifiersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <ModifiersManagement />
    </RoleGuard>
  )
}

function ModifiersManagement() {
  const [modifiers, setModifiers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', price: 0 })

  useEffect(() => {
    loadModifiers()
  }, [])

  const loadModifiers = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('product_modifiers').select('*').order('name')
    setModifiers(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('product_modifiers').insert({ name: formData.name, price: formData.price })
    if (error) alert('Error: ' + error.message)
    else {
      setShowModal(false)
      setFormData({ name: '', price: 0 })
      loadModifiers()
    }
  }

  const deleteModifier = async (id: string) => {
    if (confirm('Delete this modifier?')) {
      await supabase.from('product_modifiers').delete().eq('id', id)
      loadModifiers()
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Modifiers</h1>
          <p className="text-gray-400 mt-1">Manage product modifiers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Add Modifier</button>
      </div>

      <div className="bg-white rounded-lg p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modifiers.map((mod) => (
              <tr key={mod.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold">{mod.name}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(mod.price)}</td>
                <td className="py-3 px-4"><button onClick={() => deleteModifier(mod.id)} className="text-red-600 hover:underline text-sm">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Modifier</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
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
