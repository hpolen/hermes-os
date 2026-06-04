import { NextResponse } from 'next/server'
import { createProject, getProjects } from '@/lib/firebase/projects'
import { SEED_PROJECTS } from '@/lib/data/seed-projects'

export async function POST() {
  try {
    const existing = await getProjects()
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already seeded', count: existing.length })
    }
    const ids = await Promise.all(SEED_PROJECTS.map(p => createProject(p)))
    return NextResponse.json({ message: 'Seeded successfully', count: ids.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
