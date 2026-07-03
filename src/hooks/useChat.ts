import { useCallback, useRef, useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db/db'
import { formatCoachContext } from '../utils/coachContext'

const MODEL = 'claude-opus-4-8'

const SYSTEM_PROMPT = `You are HevyStats Coach, a strength training assistant built into HevyStats, a local-first dashboard that analyzes the user's full Hevy workout history.

Rules:
- Base your answers on the training data summary below. Cite concrete numbers and dates from it.
- Respond in the language the user writes in.
- Use plain text only — no markdown, no headers, no bullet asterisks. Short paragraphs are fine.
- Be a pragmatic coach: concrete, encouraging, honest about plateaus. Keep answers focused.
- e1RM means estimated one-rep max (Epley). Volume is working-set tonnage in kg (warmups excluded).
- You are not a doctor: for pain or injury questions, give general prudence and suggest a professional.

`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type ChatStatus = 'idle' | 'streaming' | 'error'

async function buildSystemPrompt(): Promise<string> {
  const [workouts, exercises, sets] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.sets.toArray(),
  ])
  return SYSTEM_PROMPT + formatCoachContext(workouts, exercises, sets)
}

function describeError(cause: unknown): string {
  if (cause instanceof Anthropic.AuthenticationError) {
    return 'Invalid API key. Check it in the settings below.'
  }
  if (cause instanceof Anthropic.RateLimitError) {
    return 'Rate limit reached on your Anthropic account. Try again in a minute.'
  }
  if (cause instanceof Anthropic.APIConnectionError) {
    return 'Could not reach the Anthropic API. Check your connection.'
  }
  if (cause instanceof Anthropic.APIError) {
    return `Anthropic API error (${cause.status}): ${cause.message}`
  }
  return cause instanceof Error ? cause.message : String(cause)
}

/** Streaming BYOK chat with the coach. The key never leaves the browser. */
export function useChat(apiKey: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  // The stats summary is built once per conversation and kept stable so the
  // prompt prefix stays byte-identical across turns (prompt caching).
  const systemRef = useRef<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !apiKey) return

      setStatus('streaming')
      setError(null)

      const history: ChatMessage[] = [
        ...messagesRef.current,
        { role: 'user', content: trimmed },
      ]
      messagesRef.current = history
      setMessages([...history, { role: 'assistant', content: '' }])

      try {
        systemRef.current ??= await buildSystemPrompt()

        // BYOK: the user's own key, sent only to api.anthropic.com
        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          thinking: { type: 'adaptive' },
          system: [
            {
              type: 'text',
              text: systemRef.current,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        })

        stream.on('text', (delta) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'assistant') return prev
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: last.content + delta },
            ]
          })
        })

        const final = await stream.finalMessage()
        const answer = final.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')

        if (final.stop_reason === 'refusal' && !answer) {
          throw new Error('The model declined to answer this request.')
        }

        messagesRef.current = [
          ...history,
          { role: 'assistant', content: answer },
        ]
        setMessages(messagesRef.current)
        setStatus('idle')
      } catch (cause) {
        // Drop the empty assistant placeholder but keep the user's message
        messagesRef.current = history
        setMessages(history)
        setError(describeError(cause))
        setStatus('error')
      }
    },
    [apiKey],
  )

  const reset = useCallback(() => {
    messagesRef.current = []
    setMessages([])
    setStatus('idle')
    setError(null)
    systemRef.current = null
  }, [])

  return { messages, status, error, send, reset }
}
