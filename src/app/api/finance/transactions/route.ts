import { NextRequest, NextResponse } from 'next/server'
import { mcpCall } from '@/lib/finance/mcpClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const args: Record<string, unknown> = {}

    const accountId = searchParams.get('account_id')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limitStr = searchParams.get('limit')

    if (accountId) args.account_id = accountId
    if (start) args.start = start
    if (end) args.end = end
    if (category) args.category = category
    if (search) args.search = search
    if (limitStr) args.limit = parseInt(limitStr, 10)

    const result = await mcpCall('get_transactions', args)
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
