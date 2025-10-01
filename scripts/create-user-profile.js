const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createUserProfile() {
  const userId = process.argv[2]
  
  if (!userId) {
    console.error('Please provide user ID: node scripts/create-user-profile.js [USER_ID]')
    return
  }

  try {
    console.log('Creating user profile for ID:', userId)

    // Get organization and location
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'Yaya Xtra Residence')
      .single()

    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Kisaasi')
      .single()

    if (!org || !location) {
      console.error('Organization or location not found. Run setup-database.js first.')
      return
    }

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'yayaxtra@gmail.com',
        first_name: 'Stanley',
        last_name: 'Ndawula',
        role: 'admin',
        organization_id: org.id,
        location_id: location.id,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      console.error('User profile creation failed:', userError)
      return
    }

    console.log('✅ User profile created:', user.first_name, user.last_name)

    // Now create departments (user exists for RLS)
    const departments = [
      { name: 'Restaurant', description: 'Full meals and dining experience', sort_order: 1 },
      { name: 'Bar', description: 'Alcoholic beverages and bar service', sort_order: 2 },
      { name: 'Fumes', description: 'Hookah and smoking lounge', sort_order: 3 }
    ]

    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .insert(
        departments.map(dept => ({
          location_id: location.id,
          name: dept.name,
          description: dept.description,
          color: '#1a1a1a',
          sort_order: dept.sort_order
        }))
      )
      .select()

    if (deptError) {
      console.error('Departments creation failed:', deptError)
      return
    }

    console.log('✅ Departments created:', depts.map(d => d.name).join(', '))

    console.log('\n🎉 Setup complete!')
    console.log('You can now login with:')
    console.log('Email: yayaxtra@gmail.com')
    console.log('Password: Stanley@2025')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

createUserProfile()