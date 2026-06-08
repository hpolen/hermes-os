import { NextResponse } from 'next/server'
import { mcpCall } from '@/lib/finance/mcpClient'

export async function GET() {
  try {
    const result = await mcpCall('list_accounts', {})
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const isOffline =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('daemon')
    return NextResponse.json(
      { error: message, offline: isOffline },
      { status: isOffline ? 503 : 500 }
    )
  }
}
