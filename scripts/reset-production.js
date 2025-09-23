#!/usr/bin/env node

/**
 * Production Database Reset Script
 * Handles complete database reset using Supabase client
 */

const { createClient } = require('@supabase/supabase-js')

// Production Supabase credentials
const SUPABASE_URL = 'https://twdxyamivwwtwlkkrdgi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHh5YW1pdnd3dHdsa2tyZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Nzg2ODksImV4cCI6MjA3NDE1NDY4OX0.ya4C60xR7wcn3CRBlxkZUNm32zddxIGqE-Oe8hbmWpw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function resetDatabase() {
  console.log('🔄 Starting database reset...')
  
  try {
    // Delete all data in correct order (respecting foreign keys)
    const tables = [
      'order_items',
      'orders', 
      'payments',
      'product_modifiers',
      'products',
      'categories',
      'tables',
      'departments',
      'users',
      'locations',
      'organizations'
    ]

    for (const table of tables) {
      console.log(`🗑️  Clearing ${table}...`)
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 0) // Delete all records
      
      if (error && !error.message.includes('No rows found')) {
        console.warn(`⚠️  Warning clearing ${table}:`, error.message)
      } else {
        console.log(`✅ Cleared ${table}`)
      }
    }

    // Verify reset
    console.log('\n📊 Verifying reset...')
    for (const table of ['organizations', 'users', 'locations', 'departments']) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        console.log(`${table}: ${count} records`)
      }
    }

    console.log('\n🎉 Database reset complete!')
    console.log('🚀 Ready for fresh super admin setup at:')
    console.log('   https://yaya-pos-system.vercel.app/super-admin-setup')
    console.log('   Setup Key: YAYA_SUPER_2024')

  } catch (error) {
    console.error('❌ Reset failed:', error.message)
    process.exit(1)
  }
}

// Run reset
resetDatabase()