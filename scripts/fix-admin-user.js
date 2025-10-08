const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixAdminUser() {
  console.log('Checking admin user...')
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'yayaxtra@gmail.com')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Found users:', users)
  
  if (users && users.length > 0) {
    const user = users[0]
    console.log('User data:', JSON.stringify(user, null, 2))
    console.log('\nUser can login with:')
    console.log('Email: yayaxtra@gmail.com')
    console.log('Password: (check Supabase Auth dashboard)')
  } else {
    console.log('No user found with email yayaxtra@gmail.com')
  }
}

fixAdminUser()
