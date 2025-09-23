import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
    
    const dbResponseTime = Date.now() - startTime
    
    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: 'down',
            error: error.message,
            responseTime: dbResponseTime
          },
          api: {
            status: 'up',
            responseTime: Date.now() - startTime
          }
        }
      }, { status: 503 })
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'up',
          responseTime: dbResponseTime
        },
        api: {
          status: 'up',
          responseTime: Date.now() - startTime
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      services: {
        database: {
          status: 'unknown'
        },
        api: {
          status: 'down'
        }
      }
    }, { status: 503 })
  }
}