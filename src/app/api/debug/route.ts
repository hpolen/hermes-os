import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' })
  try {
    const parsed = JSON.parse(key)
    return NextResponse.json({
      ok: true,
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      has_private_key: !!parsed.private_key,
    })
  } catch (e) {
    return NextResponse.json({ error: 'JSON parse failed: ' + String(e), raw_length: key.length })
  }
}
