import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: connectionError.message,
        details: connectionError
      }, { status: 500 })
    }

    // Check if tables exist
    const tableChecks = await Promise.all([
      supabase.from('organizations').select('count').limit(1),
      supabase.from('locations').select('count').limit(1),
      supabase.from('users').select('count').limit(1),
      supabase.from('departments').select('count').limit(1),
      supabase.from('categories').select('count').limit(1),
      supabase.from('products').select('count').limit(1),
      supabase.from('orders').select('count').limit(1),
      supabase.from('tables').select('count').limit(1)
    ])

    const tableStatus = {
      organizations: !tableChecks[0].error,
      locations: !tableChecks[1].error,
      users: !tableChecks[2].error,
      departments: !tableChecks[3].error,
      categories: !tableChecks[4].error,
      products: !tableChecks[5].error,
      orders: !tableChecks[6].error,
      tables: !tableChecks[7].error
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists)

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection successful',
      connection: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        connected: true
      },
      database: {
        tablesExist: allTablesExist,
        tableStatus,
        missingTables: Object.entries(tableStatus)
          .filter(([_, exists]) => !exists)
          .map(([table]) => table)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}