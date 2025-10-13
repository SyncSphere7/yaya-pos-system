const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  const email = 'yayaxtra@gmail.com'
  const newPassword = 'Admin@123'
  
  console.log('Resetting password for:', email)
  
  // Check if user exists in auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error listing auth users:', authError)
    return
  }
  
  const authUser = authUsers.users.find(u => u.email === email)
  
  if (!authUser) {
    console.log('User not found in auth.users, creating...')
    
    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true
    })
    
    if (createError) {
      console.error('Error creating user:', createError)
      return
    }
    
    console.log('✅ User created successfully!')
    console.log('Email:', email)
    console.log('Password:', newPassword)
    console.log('User ID:', newUser.user.id)
    
    // Update users table with auth user ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ id: newUser.user.id })
      .eq('email', email)
    
    if (updateError) {
      console.error('Error updating users table:', updateError)
    }
  } else {
    console.log('User found, updating password...')
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    )
    
    if (updateError) {
      console.error('Error updating password:', updateError)
      return
    }
    
    console.log('✅ Password updated successfully!')
    console.log('Email:', email)
    console.log('Password:', newPassword)
  }
}

resetAdminPassword()
