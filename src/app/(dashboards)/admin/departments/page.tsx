'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DepartmentsPage() {
  return <RoleGuard allowedRoles={['admin']}><DepartmentsManagement /></RoleGuard>
}

function DepartmentsManagement() {
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    if (user?.locationId) loadDepartments()
  }, [user?.locationId])

  const loadDepartments = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('departments').select('*').eq('location_id', user?.locationId).order('name')
    setDepartments(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('departments').insert({ name: formData.name, description: formData.description, location_id: user?.locationId, is_active: true })
    if (error) alert('Error: ' + error.message)
    else {
      setShowModal(false)
      setFormData({ name: '', description: '' })
      loadDepartments()
    }
  }

  const toggleActive = async (deptId: string, currentStatus: boolean) => {
    await supabase.from('departments').update({ is_active: !currentStatus }).eq('id', deptId)
    loadDepartments()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Departments</h1>
          <p className="text-gray-400 mt-1">Manage business departments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold">Add Department</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{dept.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{dept.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{dept.description || 'No description'}</p>
            <button onClick={() => toggleActive(dept.id, dept.is_active)} className="text-blue-600 text-sm">{dept.is_active ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Department</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-[#D4AF37] text-black py-2 rounded-lg font-semibold">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
