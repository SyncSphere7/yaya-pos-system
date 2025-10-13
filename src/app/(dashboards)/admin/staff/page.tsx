'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaffPage() {
  return <RoleGuard allowedRoles={['admin', 'manager']}><StaffManagement /></RoleGuard>
}

function StaffManagement() {
  const { user } = useAuthStore()
  const [staff, setStaff] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', role: 'waiter', pin: '' })

  useEffect(() => {
    if (user?.locationId) loadStaff()
  }, [user?.locationId])

  const loadStaff = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('users').select('*').eq('location_id', user?.locationId).order('created_at', { ascending: false })
    setStaff(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.role || !formData.pin || formData.pin.length !== 4) {
      alert('Please fill all fields. PIN must be 4 digits.')
      return
    }
    const { error } = await supabase.from('users').insert({ 
      id: crypto.randomUUID(),
      name: formData.name, 
      role: formData.role, 
      pin: formData.pin, 
      pin_enabled: true,
      location_id: user?.locationId, 
      organization_id: user?.organizationId, 
      is_active: true 
    })
    if (error) alert('Error: ' + error.message)
    else {
      setShowModal(false)
      setFormData({ name: '', role: 'waiter', pin: '' })
      loadStaff()
    }
  }

  const toggleActive = async (staffId: string, currentStatus: boolean) => {
    await supabase.from('users').update({ is_active: !currentStatus }).eq('id', staffId)
    loadStaff()
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Staff</h1>
          <p className="text-gray-400 mt-1">Manage team members</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold">Add Staff</button>
      </div>

      <div className="bg-white rounded-lg p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">PIN</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold">{m.name}</td>
                <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{m.role}</span></td>
                <td className="py-3 px-4 font-mono">{m.pin || '-'}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs ${m.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="py-3 px-4"><button onClick={() => toggleActive(m.id, m.is_active)} className="text-blue-600 text-sm">{m.is_active ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Staff</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="waiter">Waiter (Orders + Payments)</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">PIN (4 digits)</label>
                <input type="text" maxLength={4} pattern="[0-9]{4}" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
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
