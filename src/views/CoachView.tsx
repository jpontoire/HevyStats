import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useLlmConfig } from '../hooks/useLlmConfig'
import { useChat } from '../hooks/useChat'
import {
  defaultConfigFor,
  isConfigComplete,
  PROVIDER_IDS,
  PROVIDER_PRESETS,
} from '../llm/presets'
import type { LlmConfig, ProviderId } from '../llm/types'

const SUGGESTIONS = [
  'How is my bench press progressing?',
  'Which muscle groups am I neglecting?',
  'Where do I have plateaus, and how do I break them?',
]

const FIELD_CLASS =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100'

interface ProviderSetupProps {
  initial: LlmConfig | null
  onSave: (config: LlmConfig) => void
  onCancel?: (() => void) | undefined
}

function ProviderSetup({ initial, onSave, onCancel }: ProviderSetupProps) {
  const [draft, setDraft] = useState<LlmConfig>(
    initial ?? defaultConfigFor('anthropic'),
  )
  const preset = PROVIDER_PRESETS[draft.provider]

  const switchProvider = (provider: ProviderId) => {
    // Start from the provider's defaults; keep nothing but what the user
    // is about to re-enter — keys and models are provider-specific.
    setDraft(defaultConfigFor(provider))
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Connect an AI provider
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Bring your own key: everything is stored only in this browser and sent
        only to the endpoint you configure — HevyStats has no server. API usage
        is billed to your own account (or free with a local model).
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (isConfigComplete(draft)) onSave(draft)
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Provider
          <select
            value={draft.provider}
            onChange={(event) =>
              switchProvider(event.target.value as ProviderId)
            }
            className={FIELD_CLASS}
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDER_PRESETS[id].label}
              </option>
            ))}
          </select>
        </label>

        {draft.provider !== 'anthropic' && (
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Base URL
            <input
              type="url"
              value={draft.baseUrl}
              onChange={(event) =>
                setDraft({ ...draft, baseUrl: event.target.value })
              }
              placeholder="https://api.example.com/v1"
              className={FIELD_CLASS}
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Model
          <input
            type="text"
            value={draft.model}
            onChange={(event) =>
              setDraft({ ...draft, model: event.target.value })
            }
            placeholder={preset.defaultModel || 'model-name'}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          API key{preset.requiresKey ? '' : ' (optional)'}
          <input
            type="password"
            value={draft.apiKey}
            onChange={(event) =>
              setDraft({ ...draft, apiKey: event.target.value })
            }
            placeholder={preset.requiresKey ? 'sk-…' : 'usually not needed'}
            autoComplete="off"
            className={FIELD_CLASS}
          />
        </label>

        {preset.keyUrl && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Get a key at{' '}
            <a
              href={preset.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline dark:text-indigo-400"
            >
              {new URL(preset.keyUrl).host}
            </a>
            .
          </p>
        )}
        {preset.hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {preset.hint}
          </p>
        )}

        <div className="mt-1 flex gap-2">
          <button
            type="submit"
            disabled={!isConfigComplete(draft)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            Save
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function CoachView() {
  const { config, setConfig } = useLlmConfig()
  const { messages, status, error, send, reset } = useChat(config)
  const [input, setInput] = useState('')
  const [editingSettings, setEditingSettings] = useState(false)
  const workoutCount = useLiveQuery(() => db.workouts.count())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (text: string) => {
    if (status === 'streaming' || !text.trim()) return
    setInput('')
    send(text)
  }

  if (!config || editingSettings) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <ProviderSetup
          initial={config}
          onSave={(next) => {
            setConfig(next)
            setEditingSettings(false)
          }}
          onCancel={config ? () => setEditingSettings(false) : undefined}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Coach
          </h1>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {PROVIDER_PRESETS[config.provider].label} · {config.model}
          </span>
        </div>
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
            onClick={() => setEditingSettings(true)}
            className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Settings
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
