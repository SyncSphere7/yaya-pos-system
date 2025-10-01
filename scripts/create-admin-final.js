const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createAdminFinal() {
  const userId = '9f31c315-de6f-4f8a-b727-cd3b9fb9a664'
  
  try {
    console.log('Creating admin user profile...')

    // Use the latest organization and location
    const orgId = '8d860e9d-b399-440d-ae69-2d4db634b51b'
    const locationId = '28ea5e67-7a34-4ff6-be18-2d6a1aff41f0'

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'yayaxtra@gmail.com',
        first_name: 'Stanley',
        last_name: 'Ndawula',
        role: 'admin',
        organization_id: orgId,
        location_id: locationId,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      console.error('User profile creation failed:', userError)
      return
    }

    console.log('✅ User profile created:', user.first_name, user.last_name)

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
          location_id: locationId,
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
    console.log('Login details:')
    console.log('Email: yayaxtra@gmail.com')
    console.log('Password: Stanley@2025')
    console.log('URL: https://yaya-pos-system.vercel.app')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

createAdminFinal()