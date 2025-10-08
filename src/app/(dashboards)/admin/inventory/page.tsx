'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <InventoryManagement />
    </RoleGuard>
  )
}

function InventoryManagement() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', unit: 'kg', quantity: 0, min_quantity: 0 })

  useEffect(() => {
    if (user?.locationId) loadInventory()
  }, [user?.locationId])

  const loadInventory = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('inventory_items').select('*').eq('location_id', user?.locationId).order('name')
    setItems(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('inventory_items').insert({
      name: formData.name,
      unit: formData.unit,
      quantity: formData.quantity,
      min_quantity: formData.min_quantity,
      location_id: user?.locationId
    })

    if (error) {
      alert('Error creating item: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({ name: '', unit: 'kg', quantity: 0, min_quantity: 0 })
      loadInventory()
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400 mt-1">Track stock levels</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Add Item</button>
      </div>

      <div className="bg-white rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-left py-3 px-4">Unit</th>
                <th className="text-right py-3 px-4">Quantity</th>
                <th className="text-right py-3 px-4">Min Quantity</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">{item.name}</td>
                  <td className="py-3 px-4">{item.unit}</td>
                  <td className="py-3 px-4 text-right">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">{item.min_quantity}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.quantity <= item.min_quantity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {item.quantity <= item.min_quantity ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No inventory items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="kg">Kilograms</option>
                  <option value="liters">Liters</option>
                  <option value="pieces">Pieces</option>
                  <option value="bottles">Bottles</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Min Quantity</label>
                <input type="number" min="0" value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
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
