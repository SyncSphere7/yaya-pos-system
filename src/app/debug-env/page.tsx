'use client'

export default function DebugEnvPage() {
  const setupKey = process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Debug</h1>
      <p><strong>NEXT_PUBLIC_SUPER_ADMIN_KEY:</strong> {setupKey || 'undefined'}</p>
      <p><strong>All NEXT_PUBLIC vars:</strong></p>
      <pre>{JSON.stringify(
        Object.keys(process.env)
          .filter(key => key.startsWith('NEXT_PUBLIC_'))
          .reduce((obj, key) => {
            obj[key] = process.env[key]
            return obj
          }, {} as any), 
        null, 
        2
      )}</pre>
    </div>
  )
}