const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function activateAdmin() {
  const adminEmail = 'yayaxtra@gmail.com'
  
  console.log('🔧 Activating admin account...')
  console.log('Email:', adminEmail)
  
  try {
    // Step 1: Check if user profile exists
    console.log('\n1️⃣ Checking user profile...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
    
    if (userError) {
      console.error('Error checking users:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.error('❌ No user found with email:', adminEmail)
      console.log('\n💡 Run this script to create the admin:')
      console.log('   node scripts/fix-admin-login.js')
      return
    }
    
    const user = users[0]
    console.log('✅ User found:', user.email)
    console.log('   Current status:', user.is_active ? '✅ Active' : '❌ Inactive')
    console.log('   Role:', user.role)
    console.log('   Organization ID:', user.organization_id)
    console.log('   Location ID:', user.location_id)
    
    // Step 2: Ensure user is active
    if (!user.is_active) {
      console.log('\n2️⃣ Activating user...')
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail)
      
      if (updateError) {
        console.error('Error activating user:', updateError)
        return
      }
      console.log('✅ User activated successfully!')
    } else {
      console.log('\n✅ User is already active')
    }
    
    // Step 3: Ensure user has proper role and permissions
    console.log('\n3️⃣ Checking permissions...')
    const updates = {}
    let needsUpdate = false
    
    if (user.role !== 'admin') {
      updates.role = 'admin'
      needsUpdate = true
      console.log('   Updating role to admin')
    }
    
    if (!user.is_super_admin) {
      updates.is_super_admin = true
      needsUpdate = true
      console.log('   Setting super_admin flag')
    }
    
    if (!user.permissions || !user.permissions.includes('all')) {
      updates.permissions = ['all']
      needsUpdate = true
      console.log('   Adding all permissions')
    }
    
    if (!user.pin || user.pin !== '1234') {
      updates.pin = '1234'
      updates.pin_enabled = true
      needsUpdate = true
      console.log('   Setting PIN to 1234')
    }
    
    if (needsUpdate) {
      updates.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('email', adminEmail)
      
      if (updateError) {
        console.error('Error updating user:', updateError)
        return
      }
      console.log('✅ User permissions updated')
    } else {
      console.log('✅ User permissions are correct')
    }
    
    // Step 4: Check organization and location
    if (user.organization_id) {
      console.log('\n4️⃣ Checking organization...')
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organization_id)
        .single()
      
      if (orgError) {
        console.log('⚠️  Organization not found, user may need to be reassigned')
      } else {
        console.log('✅ Organization:', org.name)
      }
    }
    
    if (user.location_id) {
      console.log('\n5️⃣ Checking location...')
      const { data: location, error: locError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', user.location_id)
        .single()
      
      if (locError) {
        console.log('⚠️  Location not found, user may need to be reassigned')
      } else {
        console.log('✅ Location:', location.name)
      }
    }
    
    console.log('\n🎉 Admin account is now active and ready!')
    console.log('\n📋 Login Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🌐 Local: http://localhost:3000')
    console.log('🌐 Production: https://yaya-pos-system.vercel.app')
    console.log('📧 Email: ' + adminEmail)
    console.log('🔑 Password: Admin@123')
    console.log('📱 PIN: 1234')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 Try logging in now!')
    
  } catch (error) {
    console.error('❌ Activation failed:', error)
  }
}

activateAdmin()
