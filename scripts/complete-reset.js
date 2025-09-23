#!/usr/bin/env node

/**
 * Complete System Reset - Database + Auth
 * This handles everything needed for a fresh start
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://twdxyamivwwtwlkkrdgi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHh5YW1pdnd3dHdsa2tyZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Nzg2ODksImV4cCI6MjA3NDE1NDY4OX0.ya4C60xR7wcn3CRBlxkZUNm32zddxIGqE-Oe8hbmWpw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function completeReset() {
  console.log('🔥 COMPLETE SYSTEM RESET')
  console.log('========================')
  
  try {
    // 1. Clear all database tables
    console.log('\n1️⃣ Clearing database tables...')
    const tables = ['organizations', 'locations', 'users']
    
    for (const table of tables) {
      const { data } = await supabase.from(table).select('id')
      if (data && data.length > 0) {
        console.log(`   Clearing ${data.length} records from ${table}`)
        for (const record of data) {
          await supabase.from(table).delete().eq('id', record.id)
        }
      }
    }

    // 2. Verify database is clean
    console.log('\n2️⃣ Verifying database cleanup...')
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: locCount } = await supabase.from('locations').select('*', { count: 'exact', head: true })
    
    console.log(`   Organizations: ${orgCount}`)
    console.log(`   Users: ${userCount}`)
    console.log(`   Locations: ${locCount}`)

    // 3. Instructions for auth cleanup
    console.log('\n3️⃣ Auth Users Cleanup Required:')
    console.log('   🔗 Go to: https://supabase.com/dashboard/project/twdxyamivwwtwlkkrdgi/auth/users')
    console.log('   🗑️  Delete all users manually (click delete on each)')
    console.log('   ⚠️  This step must be done manually in Supabase Dashboard')

    if (orgCount === 0 && userCount === 0 && locCount === 0) {
      console.log('\n✅ DATABASE RESET COMPLETE!')
      console.log('\n🎯 Next Steps:')
      console.log('   1. Delete auth users in Supabase Dashboard (link above)')
      console.log('   2. Visit: https://yaya-pos-system.vercel.app/super-admin-setup')
      console.log('   3. Use setup key: YayaSuper@2025')
      console.log('   4. Create fresh super admin account')
      console.log('\n🚀 System will be ready for production use!')
    } else {
      console.log('\n❌ Database cleanup incomplete')
    }

  } catch (error) {
    console.error('❌ Reset failed:', error.message)
  }
}

completeReset()