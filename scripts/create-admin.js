const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createAdminUser() {
  try {
    console.log('Creating Supabase Auth user...')
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'yayaxtra@gmail.com',
      password: 'Stanley@2025',
      email_confirm: true // Skip email verification
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return
    }

    console.log('Auth user created with ID:', authData.user.id)

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Yaya Xtra Residence'
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation failed:', orgError)
      return
    }

    console.log('Organization created:', org.name)

    // Create location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        organization_id: org.id,
        name: 'Kisaasi',
        address: 'Plot 508, Block 215, Kulambiro Ring Road, Kisaasi, Kampala.',
        phone: '+256 393-228-427'
      })
      .select()
      .single()

    if (locationError) {
      console.error('Location creation failed:', locationError)
      return
    }

    console.log('Location created:', location.name)

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
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

    console.log('User profile created:', user.first_name, user.last_name)

    // Create departments
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

    console.log('Departments created:', depts.map(d => d.name).join(', '))

    console.log('\n✅ Setup complete!')
    console.log('Login details:')
    console.log('Email: yayaxtra@gmail.com')
    console.log('Password: Stanley@2025')
    console.log('User ID:', authData.user.id)

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

createAdminUser()