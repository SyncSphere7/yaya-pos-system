'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TablesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <TablesManagement />
    </RoleGuard>
  )
}

function TablesManagement() {
  const { user } = useAuthStore()
  const [tables, setTables] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ table_number: '', capacity: 4 })

  useEffect(() => {
    if (user?.locationId) loadTables()
  }, [user?.locationId])

  const loadTables = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('tables').select('*').eq('location_id', user?.locationId).order('table_number')
    setTables(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('tables').insert({
      table_number: formData.table_number,
      capacity: formData.capacity,
      location_id: user?.locationId,
      status: 'available'
    })

    if (error) {
      alert('Error creating table: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({ table_number: '', capacity: 4 })
      loadTables()
    }
  }

  const deleteTable = async (tableId: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      await supabase.from('tables').delete().eq('id', tableId)
      loadTables()
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'available') return 'bg-green-100 text-green-800'
    if (status === 'occupied') return 'bg-red-100 text-red-800'
    if (status === 'reserved') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Tables Management</h1>
          <p className="text-gray-400 mt-1">Manage restaurant tables</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#c4a137]">Add Table</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold mb-2">Table {table.table_number}</div>
            <div className="text-sm text-gray-600 mb-2">Capacity: {table.capacity}</div>
            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(table.status)}`}>{table.status}</span>
            <button onClick={() => deleteTable(table.id)} className="mt-3 text-red-600 hover:underline text-xs block w-full">Delete</button>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">No tables found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Table</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Table Number</label>
                <input type="text" value={formData.table_number} onChange={(e) => setFormData({ ...formData, table_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
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
