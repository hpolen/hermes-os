import { NextResponse } from 'next/server'
import { createSign } from 'crypto'
import { SEED_PROJECTS } from '@/lib/data/seed-projects'

async function getAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url')
  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const sig = sign.sign(sa.private_key, 'base64url')
  const jwt = `${header}.${payload}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  })
  const data = await res.json() as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`)
  return data.access_token
}

export async function POST() {
  try {
    const keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!keyStr) return NextResponse.json({ error: 'Missing service account key' }, { status: 500 })
    const sa = JSON.parse(keyStr)
    const token = await getAccessToken(sa)
    const project = sa.project_id
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`

    // Check if already seeded
    const check = await fetch(`${baseUrl}/projects?pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const checkData = await check.json() as { documents?: unknown[] }
    if (checkData.documents && checkData.documents.length > 0) {
      return NextResponse.json({ message: 'Already seeded', count: checkData.documents.length })
    }

    // Seed all projects
    const results = await Promise.all(SEED_PROJECTS.map(async (p) => {
      const body = {
        fields: {
          name: { stringValue: p.name },
          tier: { integerValue: String(p.tier) },
          health: { stringValue: p.health },
          status: { stringValue: p.status },
          mission: { stringValue: p.mission },
          goals: { arrayValue: { values: p.goals.map(g => ({ stringValue: g })) } },
          risks: { arrayValue: { values: p.risks.map(r => ({ stringValue: r })) } },
          dependencies: { arrayValue: { values: [] } },
          assignedAgents: { arrayValue: { values: p.assignedAgents.map(a => ({ stringValue: a })) } },
          lastActivity: { nullValue: null },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() },
        }
      }
      const res = await fetch(`${baseUrl}/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      return res.ok ? 'ok' : await res.text()
    }))

    const failed = results.filter(r => r !== 'ok')
    if (failed.length > 0) return NextResponse.json({ error: 'Some failed', details: failed }, { status: 500 })

    return NextResponse.json({ message: 'Seeded successfully', count: SEED_PROJECTS.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
