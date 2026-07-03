import { useCallback, useState } from 'react'

const STORAGE_KEY = 'hevystats.anthropicApiKey'

/**
 * BYOK: the Anthropic API key lives only in this browser (localStorage).
 * The optional VITE_ANTHROPIC_API_KEY env var pre-fills it for local dev.
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(
    () =>
      localStorage.getItem(STORAGE_KEY) ??
      (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ??
      '',
  )

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed)
    else localStorage.removeItem(STORAGE_KEY)
    setApiKeyState(trimmed)
  }, [])

  return { apiKey, setApiKey }
}
