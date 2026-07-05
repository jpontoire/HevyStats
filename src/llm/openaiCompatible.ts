import type { StreamChatFn } from './types'

interface CompletionChunk {
  choices?: { delta?: { content?: string | null } }[]
}

/**
 * Any endpoint speaking the OpenAI chat completions API with SSE streaming:
 * OpenAI itself, Ollama, LM Studio, Groq, Mistral, OpenRouter…
 */
export const streamOpenAiCompatibleChat: StreamChatFn = async ({
  config,
  system,
  messages,
  onDelta,
}) => {
  const baseUrl = config.baseUrl.trim().replace(/\/$/, '')

  let response: Response
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey.trim()
          ? { authorization: `Bearer ${config.apiKey.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    })
  } catch {
    throw new Error(
      `Could not reach ${baseUrl}. Check the URL — and for a local endpoint, that the server is running and allows browser requests (CORS).`,
    )
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as {
        error?: { message?: string } | string
      }
      detail =
        typeof body.error === 'string' ? body.error : (body.error?.message ?? '')
    } catch {
      // non-JSON error body — keep the status code only
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('This provider rejected the API key. Check it in the settings.')
    }
    if (response.status === 404 && detail.toLowerCase().includes('model')) {
      throw new Error(`Unknown model "${config.model}" on this endpoint.`)
    }
    throw new Error(
      `Provider error (${response.status})${detail ? `: ${detail}` : ''}`,
    )
  }
  if (!response.body) throw new Error('The provider sent an empty response.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  const consume = (raw: string) => {
    const line = raw.trim()
    if (!line.startsWith('data:')) return
    const payload = line.slice(5).trim()
    if (!payload || payload === '[DONE]') return
    try {
      const chunk = JSON.parse(payload) as CompletionChunk
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        full += delta
        onDelta(delta)
      }
    } catch {
      // ignore malformed keep-alive/comment lines
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) consume(line)
  }
  consume(buffer)

  return full
}
