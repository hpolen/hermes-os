import { NextRequest, NextResponse } from 'next/server'
import { mcpCall } from '@/lib/finance/mcpClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { error: 'start and end query params are required (ISO date strings)' },
        { status: 400 }
      )
    }

    const args: Record<string, unknown> = { start, end }

    const accountId = searchParams.get('account_id')
    if (accountId) args.account_id = accountId

    const result = await mcpCall('spending_by_category', args)
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
