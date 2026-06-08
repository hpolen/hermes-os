/**
 * Server-side MCP client for goetta-finance daemon.
 * IMPORTANT: This file is server-only. The daemon URL must never reach client code.
 */

const MCP_BASE = 'http://127.0.0.1:8765'
const MCP_PATH = '/mcp'
const MCP_URL = `${MCP_BASE}${MCP_PATH}`

interface McpSessionResponse {
  sessionId: string
}

interface McpToolResult {
  result?: {
    structuredContent?: { result: unknown }
    content?: Array<{ type: string; text: string }>
    isError?: boolean
  }
  error?: {
    code: number
    message: string
  }
}

async function initSession(): Promise<McpSessionResponse> {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'hermes-os', version: '0.1.0' },
      },
    }),
    // No caching – each call gets a fresh session
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `MCP initialization failed: HTTP ${res.status} ${res.statusText}. ` +
      `Is the goetta-finance daemon running?`
    )
  }

  const sessionId = res.headers.get('mcp-session-id')
  if (!sessionId) {
    throw new Error(
      'MCP initialization succeeded but no mcp-session-id header returned. ' +
      'Unexpected server response.'
    )
  }

  return { sessionId }
}

function parseSseData(rawText: string): McpToolResult {
  const lines = rawText.split(/\r\n|\n/)
  let dataLine: string | null = null

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLine = line.slice(5).trim()
      break
    }
  }

  if (!dataLine) {
    throw new Error(
      `MCP response missing SSE data line. Raw response: ${rawText.slice(0, 300)}`
    )
  }

  try {
    return JSON.parse(dataLine) as McpToolResult
  } catch {
    throw new Error(
      `MCP response data line is not valid JSON: ${dataLine.slice(0, 300)}`
    )
  }
}

export async function mcpCall(
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // Step 1: Initialize session
  const { sessionId } = await initSession()

  // Step 2: Call the tool
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args,
      },
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `MCP tool call failed: HTTP ${res.status} ${res.statusText} (tool: ${tool})`
    )
  }

  const rawText = await res.text()
  const parsed = parseSseData(rawText)

  // Check for JSON-RPC level error
  if (parsed.error) {
    throw new Error(`MCP JSON-RPC error [${parsed.error.code}]: ${parsed.error.message}`)
  }

  // Check for tool-level error
  if (parsed.result?.isError === true) {
    const errText = parsed.result.content?.[0]?.text ?? 'Unknown tool error'
    throw new Error(`MCP tool error (${tool}): ${errText}`)
  }

  // Primary result path
  if (
    parsed.result?.structuredContent !== undefined &&
    parsed.result.structuredContent.result !== undefined
  ) {
    return parsed.result.structuredContent.result
  }

  // Fallback: parse content[0].text as JSON
  if (parsed.result?.content?.[0]?.text) {
    try {
      return JSON.parse(parsed.result.content[0].text) as unknown
    } catch {
      // Return as plain string if not JSON
      return parsed.result.content[0].text
    }
  }

  throw new Error(
    `MCP response for tool "${tool}" has no usable result. ` +
    `Raw: ${rawText.slice(0, 300)}`
  )
}
