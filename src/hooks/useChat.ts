import { useCallback, useSyncExternalStore } from 'react'
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

export interface ChatState {
  messages: ChatMessage[]
  status: ChatStatus
  error: string | null
}

/*
 * The conversation lives in a module-level store, not in component state:
 * the Coach view unmounts on navigation, and the chat must survive it
 * (including a reply that is still streaming in the background).
 */
let state: ChatState = { messages: [], status: 'idle', error: null }
// Stats summary built once per conversation and kept stable so the prompt
// prefix stays byte-identical across turns (prompt caching).
let systemPrompt: string | null = null
// Bumped on reset so an in-flight reply can't resurrect a cleared chat
let generation = 0
const listeners = new Set<() => void>()

function setState(partial: Partial<ChatState>) {
  state = { ...state, ...partial }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): ChatState {
  return state
}

async function buildSystemPrompt(): Promise<string> {
  const [workouts, exercises, sets] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.sets.toArray(),
  ])
  return SYSTEM_PROMPT + formatCoachContext(workouts, exercises, sets)
}

async function sendMessage(config: LlmConfig, text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed || state.status === 'streaming') return
  const gen = generation

  const history: ChatMessage[] = [
    ...state.messages,
    { role: 'user', content: trimmed },
  ]
  setState({
    messages: [...history, { role: 'assistant', content: '' }],
    status: 'streaming',
    error: null,
  })

  try {
    systemPrompt ??= await buildSystemPrompt()

    const answer = await streamChat({
      config,
      system: systemPrompt,
      messages: history,
      onDelta: (delta) => {
        if (gen !== generation) return
        const messages = state.messages
        const last = messages[messages.length - 1]
        if (!last || last.role !== 'assistant') return
        setState({
          messages: [
            ...messages.slice(0, -1),
            { role: 'assistant', content: last.content + delta },
          ],
        })
      },
    })

    if (gen !== generation) return
    setState({
      messages: [...history, { role: 'assistant', content: answer }],
      status: 'idle',
    })
  } catch (cause) {
    if (gen !== generation) return
    // Drop the empty assistant placeholder but keep the user's message
    setState({
      messages: history,
      status: 'error',
      error: cause instanceof Error ? cause.message : String(cause),
    })
  }
}

function resetChat(): void {
  generation++
  systemPrompt = null
  setState({ messages: [], status: 'idle', error: null })
}

/** Streaming BYOK chat with the coach; survives view unmounts. */
export function useChat(config: LlmConfig | null) {
  const { messages, status, error } = useSyncExternalStore(
    subscribe,
    getSnapshot,
  )

  const send = useCallback(
    (text: string) => {
      if (config) void sendMessage(config, text)
    },
    [config],
  )

  return { messages, status, error, send, reset: resetChat }
}
