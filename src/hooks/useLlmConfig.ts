import { useCallback, useState } from 'react'
import { defaultConfigFor, PROVIDER_PRESETS } from '../llm/presets'
import type { LlmConfig } from '../llm/types'

const STORAGE_KEY = 'hevystats.llmConfig'
/** Key used before multi-provider support; migrated on first load. */
const LEGACY_ANTHROPIC_KEY = 'hevystats.anthropicApiKey'

function loadConfig(): LlmConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<LlmConfig>
      if (parsed.provider && parsed.provider in PROVIDER_PRESETS) {
        return {
          provider: parsed.provider,
          apiKey: parsed.apiKey ?? '',
          model: parsed.model ?? '',
          baseUrl: parsed.baseUrl ?? '',
        }
      }
    } catch {
      // corrupted entry — fall through to the legacy/env paths
    }
  }

  const legacyKey =
    localStorage.getItem(LEGACY_ANTHROPIC_KEY) ??
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined)
  if (legacyKey) {
    return { ...defaultConfigFor('anthropic'), apiKey: legacyKey }
  }
  return null
}

/**
 * BYOK: the LLM connection settings (provider, key, model, endpoint) live
 * only in this browser's localStorage.
 */
export function useLlmConfig() {
  const [config, setConfigState] = useState<LlmConfig | null>(loadConfig)

  const setConfig = useCallback((next: LlmConfig | null) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_ANTHROPIC_KEY)
    setConfigState(next)
  }, [])

  return { config, setConfig }
}
