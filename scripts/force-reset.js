#!/usr/bin/env node

/**
 * Force Reset - Aggressive database cleanup
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://twdxyamivwwtwlkkrdgi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHh5YW1pdnd3dHdsa2tyZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Nzg2ODksImV4cCI6MjA3NDE1NDY4OX0.ya4C60xR7wcn3CRBlxkZUNm32zddxIGqE-Oe8hbmWpw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function forceReset() {
  console.log('💥 FORCE RESET - Clearing ALL data...')
  
  try {
    // Get all records and delete them properly
    console.log('🗑️  Force clearing organizations...')
    const { data: orgs } = await supabase.from('organizations').select('id')
    if (orgs && orgs.length > 0) {
      for (const org of orgs) {
        await supabase.from('organizations').delete().eq('id', org.id)
      }
    }

    console.log('🗑️  Force clearing locations...')
    const { data: locations } = await supabase.from('locations').select('id')
    if (locations && locations.length > 0) {
      for (const loc of locations) {
        await supabase.from('locations').delete().eq('id', loc.id)
      }
    }

    console.log('🗑️  Force clearing users...')
    const { data: users } = await supabase.from('users').select('id')
    if (users && users.length > 0) {
      for (const user of users) {
        await supabase.from('users').delete().eq('id', user.id)
      }
    }

    // Verify complete cleanup
    console.log('\n📊 Final verification...')
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
    
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    const { count: locCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })

    console.log(`Organizations: ${orgCount}`)
    console.log(`Users: ${userCount}`)
    console.log(`Locations: ${locCount}`)

    if (orgCount === 0 && userCount === 0 && locCount === 0) {
      console.log('\n✅ COMPLETE RESET SUCCESS!')
      console.log('🎯 Database is now completely clean')
      console.log('🚀 Ready for super admin setup!')
    } else {
      console.log('\n⚠️  Some records remain - manual cleanup may be needed')
    }

  } catch (error) {
    console.error('❌ Force reset failed:', error.message)
  }
}

forceReset()