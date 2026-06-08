import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

interface CronJob {
  id: string
  name: string
  schedule: string
  status: 'active' | 'paused'
  lastRun: string | null
  lastStatus: string | null
  nextRun: string | null
  deliver: string | null
}

function parseCronList(output: string): CronJob[] {
  const jobs: CronJob[] = []

  // Strip box-drawing header lines
  const cleaned = output
    .split('\n')
    .filter(line => !/^[┌│└─┐┘]/.test(line.trim()))
    .join('\n')

  // Split into blocks by double newlines
  const blocks = cleaned.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // First line: "<id> [<status>]"
    const headerMatch = lines[0].match(/^([a-f0-9]+)\s+\[(active|paused)\]/)
    if (!headerMatch) continue

    const id = headerMatch[1]
    const status = headerMatch[2] as 'active' | 'paused'

    let name = ''
    let schedule = ''
    let nextRun: string | null = null
    let lastRun: string | null = null
    let lastStatus: string | null = null
    let deliver: string | null = null

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const key = line.slice(0, colonIdx).trim().toLowerCase()
      const value = line.slice(colonIdx + 1).trim()

      if (key === 'name') {
        name = value
      } else if (key === 'schedule') {
        schedule = value
      } else if (key === 'next run') {
        nextRun = value
      } else if (key === 'last run') {
        // Format: "2026-06-07T18:01:33.772873-04:00  ok"
        const parts = value.split(/\s+/)
        lastRun = parts[0] || null
        lastStatus = parts[parts.length - 1] || null
        // If there's only one part, don't set lastStatus separately
        if (parts.length === 1) {
          lastStatus = null
        }
      } else if (key === 'deliver') {
        deliver = value
      }
    }

    if (id) {
      jobs.push({ id, name, schedule, status, lastRun, lastStatus, nextRun, deliver })
    }
  }

  return jobs
}

export async function GET() {
  try {
    const hermesPath = '/home/polenihj/.hermes/hermes-agent/venv/bin/hermes'
    const output = execSync(`${hermesPath} cron list`, {
      encoding: 'utf-8',
      timeout: 15000,
    })

    const jobs = parseCronList(output)
    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
