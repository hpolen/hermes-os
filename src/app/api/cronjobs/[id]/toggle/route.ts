import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

const hermesPath = '/home/polenihj/.hermes/hermes-agent/venv/bin/hermes'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as { action: 'pause' | 'resume' }
    const { action } = body

    if (action !== 'pause' && action !== 'resume') {
      return NextResponse.json({ error: 'Invalid action. Must be "pause" or "resume".' }, { status: 400 })
    }

    execSync(`${hermesPath} cron ${action} ${id}`, {
      encoding: 'utf-8',
      timeout: 15000,
    })

    return NextResponse.json({ success: true, action })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
