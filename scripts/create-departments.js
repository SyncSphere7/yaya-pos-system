const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createDepartments() {
  try {
    console.log('Signing in as admin...')
    
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'yayaxtra@gmail.com',
      password: 'Stanley@2025'
    })

    if (authError) {
      console.error('Sign in failed:', authError)
      return
    }

    console.log('✅ Signed in as admin')

    const locationId = '28ea5e67-7a34-4ff6-be18-2d6a1aff41f0'

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

    console.log('\n🎉 Complete setup finished!')
    console.log('You can now login at: https://yaya-pos-system.vercel.app')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

createDepartments()