import { useCallback, useRef, useState } from 'react'
import { db } from '../db/db'
import { formatCoachContext } from '../utils/coachContext'
import { streamChat } from '../llm/streamChat'
import type { ChatTurn, LlmConfig } from '../llm/types'

const SYSTEM_PROMPT = `You are HevyStats Coach, a strength training assistant built into HevyStats, a local-first dashboard that analyzes the user's full Hevy workout history.

Rules:
- Base your answers on the training data summary below. Cite concrete numbers and dates from it.
- Respond in the language the user writes in.
- Use plain text only — no markdown, no headers, no bullet asterisks. Short paragraphs are fine.
- Be a pragmatic coach: concrete, encouraging, honest about plateaus. Keep answers focused.
- e1RM means estimated one-rep max (Epley). Volume is working-set tonnage in kg (warmups excluded).
- You are not a doctor: for pain or injury questions, give general prudence and suggest a professional.

`

export type ChatMessage = ChatTurn
export type ChatStatus = 'idle' | 'streaming' | 'error'

async function buildSystemPrompt(): Promise<string> {
  const [workouts, exercises, sets] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.sets.toArray(),
  ])
  return SYSTEM_PROMPT + formatCoachContext(workouts, exercises, sets)
}

/** Streaming BYOK chat with the coach, provider-agnostic. */
export function useChat(config: LlmConfig | null) {
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
      if (!trimmed || !config) return

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

        const answer = await streamChat({
          config,
          system: systemRef.current,
          messages: history,
          onDelta: (delta) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (!last || last.role !== 'assistant') return prev
              return [
                ...prev.slice(0, -1),
                { role: 'assistant', content: last.content + delta },
              ]
            })
          },
        })

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
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus('error')
      }
    },
    [config],
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
