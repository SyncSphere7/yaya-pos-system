const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkData() {
  try {
    const { data: orgs } = await supabase.from('organizations').select('*')
    const { data: locations } = await supabase.from('locations').select('*')
    const { data: users } = await supabase.from('users').select('*')
    const { data: departments } = await supabase.from('departments').select('*')

    console.log('Organizations:', orgs)
    console.log('Locations:', locations)
    console.log('Users:', users)
    console.log('Departments:', departments)
  } catch (error) {
    console.error('Error:', error)
  }
}

checkData()