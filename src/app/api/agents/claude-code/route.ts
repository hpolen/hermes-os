import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface ClaudeAgent {
  name: string
  description: string
  model: string
  tools: string[]
  instructions: string
  filename: string
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string | string[]>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content.trim() }

  const yamlStr = match[1]
  const body = match[2].trim()
  const frontmatter: Record<string, string | string[]> = {}

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (!key) continue

    if (val.startsWith('[') && val.endsWith(']')) {
      frontmatter[key] = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    } else {
      frontmatter[key] = val
    }
  }

  return { frontmatter, body }
}

export async function GET(): Promise<NextResponse> {
  const agentsDir = path.join(process.env.HOME ?? '/home/polenihj', '.claude', 'agents')

  let files: string[]
  try {
    files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
  } catch {
    return NextResponse.json([])
  }

  const agents: ClaudeAgent[] = files.map(filename => {
    const filepath = path.join(agentsDir, filename)
    const content = fs.readFileSync(filepath, 'utf-8')
    const { frontmatter, body } = parseFrontmatter(content)

    return {
      name: (frontmatter['name'] as string) || filename.replace('.md', ''),
      description: (frontmatter['description'] as string) || '',
      model: (frontmatter['model'] as string) || '',
      tools: (frontmatter['tools'] as string[]) || [],
      instructions: body,
      filename,
    }
  })

  return NextResponse.json(agents)
}
