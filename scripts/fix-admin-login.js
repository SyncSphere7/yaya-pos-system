const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixAdminLogin() {
  const adminEmail = 'yayaxtra@gmail.com'
  const adminPassword = 'Admin@123'
  const adminPin = '1234'
  
  console.log('🔧 Fixing admin login...')
  console.log('Email:', adminEmail)
  console.log('Password:', adminPassword)
  console.log('PIN:', adminPin)
  
  try {
    // Step 1: Check if organization exists
    console.log('\n1️⃣ Checking organization...')
    let { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (orgError) {
      console.error('Error checking organizations:', orgError)
      return
    }
    
    let orgId
    if (!orgs || orgs.length === 0) {
      console.log('Creating organization...')
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Yaya Xtra Residence',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createOrgError) {
        console.error('Error creating organization:', createOrgError)
        return
      }
      orgId = newOrg.id
      console.log('✅ Organization created:', newOrg.name)
    } else {
      orgId = orgs[0].id
      console.log('✅ Organization found:', orgs[0].name)
    }
    
    // Step 2: Check if location exists
    console.log('\n2️⃣ Checking location...')
    let { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', orgId)
      .limit(1)
    
    if (locError) {
      console.error('Error checking locations:', locError)
      return
    }
    
    let locationId
    if (!locations || locations.length === 0) {
      console.log('Creating location...')
      const { data: newLocation, error: createLocError } = await supabase
        .from('locations')
        .insert({
          organization_id: orgId,
          name: 'Kisaasi',
          address: 'Plot 508, Block 215, Kulambiro Ring Road, Kisaasi, Kampala.',
          phone: '+256 393-228-427',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createLocError) {
        console.error('Error creating location:', createLocError)
        return
      }
      locationId = newLocation.id
      console.log('✅ Location created:', newLocation.name)
    } else {
      locationId = locations[0].id
      console.log('✅ Location found:', locations[0].name)
    }
    
    // Step 3: Try to sign up the admin user
    console.log('\n3️⃣ Creating/updating admin auth user...')
    
    // First try to sign up (this will fail if user exists)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword
    })
    
    let authUserId
    
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('User already exists, trying to sign in...')
      
      // Try to sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      })
      
      if (signInError) {
        console.log('Sign in failed, user might exist with different password')
        console.log('You may need to reset the password manually in Supabase Dashboard')
        console.log('Go to: Authentication > Users > Find user > Reset Password')
        return
      }
      
      authUserId = signInData.user.id
      console.log('✅ Signed in successfully')
    } else if (signUpError) {
      console.error('Sign up error:', signUpError)
      return
    } else {
      authUserId = signUpData.user.id
      console.log('✅ User created successfully')
    }
    
    // Step 4: Create/update user profile
    console.log('\n4️⃣ Creating/updating user profile...')
    
    // Check if user profile exists
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()
    
    if (checkUserError && checkUserError.code !== 'PGRST116') {
      console.error('Error checking user profile:', checkUserError)
      return
    }
    
    const userProfile = {
      id: authUserId,
      email: adminEmail,
      first_name: 'Stanley',
      last_name: 'Ndawula',
      full_name: 'Stanley Ndawula',
      role: 'admin',
      organization_id: orgId,
      location_id: locationId,
      is_active: true,
      pin: adminPin,
      pin_enabled: true,
      is_super_admin: true,
      permissions: ['all'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update(userProfile)
        .eq('email', adminEmail)
      
      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return
      }
      console.log('✅ User profile updated')
    } else {
      // Create new user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert(userProfile)
      
      if (insertError) {
        console.error('Error creating user profile:', insertError)
        return
      }
      console.log('✅ User profile created')
    }
    
    // Step 5: Create departments if they don't exist
    console.log('\n5️⃣ Setting up departments...')
    
    const { data: existingDepts, error: deptCheckError } = await supabase
      .from('departments')
      .select('*')
      .eq('location_id', locationId)
    
    if (deptCheckError) {
      console.error('Error checking departments:', deptCheckError)
      return
    }
    
    if (!existingDepts || existingDepts.length === 0) {
      const departments = [
        { name: 'Restaurant', description: 'Full meals and dining experience', sort_order: 1 },
        { name: 'Bar', description: 'Alcoholic beverages and bar service', sort_order: 2 },
        { name: 'Fumes', description: 'Hookah and smoking lounge', sort_order: 3 }
      ]
      
      const { error: deptInsertError } = await supabase
        .from('departments')
        .insert(
          departments.map(dept => ({
            location_id: locationId,
            name: dept.name,
            description: dept.description,
            color: '#1a1a1a',
            sort_order: dept.sort_order,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        )
      
      if (deptInsertError) {
        console.error('Error creating departments:', deptInsertError)
        return
      }
      console.log('✅ Departments created')
    } else {
      console.log('✅ Departments already exist')
    }
    
    // Sign out to clear any cached session
    await supabase.auth.signOut()
    
    console.log('\n🎉 Admin login fixed successfully!')
    console.log('\n📋 Login Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🌐 URL: http://localhost:3000')
    console.log('📧 Email: ' + adminEmail)
    console.log('🔑 Password: ' + adminPassword)
    console.log('📱 PIN: ' + adminPin)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 You can now login using either:')
    console.log('   • Email + Password (regular login)')
    console.log('   • PIN (quick staff login)')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

fixAdminLogin()