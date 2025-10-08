'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { useAuthStore } from '@/stores/auth'
import { useState } from 'react'

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <SettingsManagement />
    </RoleGuard>
  )
}

function SettingsManagement() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState({
    businessName: 'Yaya Xtra Residence',
    taxRate: 18,
    currency: 'UGX',
    receiptFooter: 'Thank you for your business!',
    autoLogout: 30
  })

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure system settings</p>
      </div>

      <div className="bg-white rounded-lg p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Business Name</label>
            <input type="text" value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
            <input type="number" min="0" max="100" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Receipt Footer</label>
            <textarea value={settings.receiptFooter} onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Auto Logout (minutes)</label>
            <input type="number" min="5" max="120" value={settings.autoLogout} onChange={(e) => setSettings({ ...settings, autoLogout: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <button onClick={handleSave} className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-semibold hover:bg-[#c4a137]">Save Settings</button>
        </div>
      </div>
    </div>
  )
}
