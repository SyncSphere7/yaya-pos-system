const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setupDatabase() {
  try {
    console.log('Setting up database...')

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

    console.log('✅ Organization created:', org.name)

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

    console.log('✅ Location created:', location.name)

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

    console.log('✅ Departments created:', depts.map(d => d.name).join(', '))

    console.log('\n🎉 Database setup complete!')
    console.log('\nNext steps:')
    console.log('1. Go to Supabase Dashboard → Authentication → Users')
    console.log('2. Click "Add user"')
    console.log('3. Email: yayaxtra@gmail.com')
    console.log('4. Password: Stanley@2025')
    console.log('5. Check "Email Confirm" to skip verification')
    console.log('6. Copy the generated User ID')
    console.log('7. Run: node scripts/create-user-profile.js [USER_ID]')

    console.log('\nOrganization ID:', org.id)
    console.log('Location ID:', location.id)

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupDatabase()