import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApiKey } from '../hooks/useApiKey'
import { useChat } from '../hooks/useChat'

const SUGGESTIONS = [
  'How is my bench press progressing?',
  'Which muscle groups am I neglecting?',
  'Where do I have plateaus, and how do I break them?',
]

function ApiKeySetup({ onSave }: { onSave: (key: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Connect your Anthropic API key
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        The coach runs on your own key (bring your own key). It is stored only
        in this browser and sent only to api.anthropic.com — HevyStats has no
        server. Get a key at{' '}
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 underline dark:text-indigo-400"
        >
          console.anthropic.com
        </a>
        . API usage is billed to your Anthropic account.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (value.trim()) onSave(value)
        }}
      >
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          Save
        </button>
      </form>
    </div>
  )
}

function CoachView() {
  const { apiKey, setApiKey } = useApiKey()
  const { messages, status, error, send, reset } = useChat(apiKey)
  const [input, setInput] = useState('')
  const workoutCount = useLiveQuery(() => db.workouts.count())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (text: string) => {
    if (status === 'streaming' || !text.trim()) return
    setInput('')
    void send(text)
  }

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <ApiKeySetup onSave={setApiKey} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-6 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Coach
        </h1>
        <div className="flex gap-3 text-sm">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Clear chat
            </button>
          )}
          <button
            type="button"
            onClick={() => setApiKey('')}
            className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Remove key
          </button>
        </div>
      </div>

      {workoutCount === 0 && (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          No workouts imported yet — the coach will have no data to work with.
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-neutral-500 dark:text-neutral-400">
              Ask anything about your training history.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:border-indigo-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-indigo-500"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'self-end bg-indigo-600 text-white'
                    : 'self-start bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                }`}
              >
                {message.content ||
                  (status === 'streaming' && index === messages.length - 1
                    ? '…'
                    : '')}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <form
        className="flex gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
        onSubmit={(event) => {
          event.preventDefault()
          submit(input)
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask your coach…"
          disabled={status === 'streaming'}
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="submit"
          disabled={status === 'streaming' || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  )
}

export default CoachView
