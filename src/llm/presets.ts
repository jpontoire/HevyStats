import type { LlmConfig, ProviderId } from './types'

export interface ProviderPreset {
  label: string
  defaultModel: string
  defaultBaseUrl: string
  requiresKey: boolean
  keyUrl?: string
  hint?: string
}

export const PROVIDER_PRESETS: Record<ProviderId, ProviderPreset> = {
  anthropic: {
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-opus-4-8',
    defaultBaseUrl: '',
    requiresKey: true,
    keyUrl: 'https://console.anthropic.com/',
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  ollama: {
    label: 'Ollama (local)',
    defaultModel: 'llama3.1',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    hint: 'Start Ollama with OLLAMA_ORIGINS set to this site\'s origin (or "*") so the browser is allowed to call it.',
  },
  custom: {
    label: 'OpenAI-compatible (custom)',
    defaultModel: '',
    defaultBaseUrl: '',
    requiresKey: false,
    hint: 'Any endpoint speaking the OpenAI chat completions API: LM Studio, Groq, Mistral, OpenRouter…',
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDER_PRESETS) as ProviderId[]

export function defaultConfigFor(provider: ProviderId): LlmConfig {
  const preset = PROVIDER_PRESETS[provider]
  return {
    provider,
    apiKey: '',
    model: preset.defaultModel,
    baseUrl: preset.defaultBaseUrl,
  }
}

/** A config is usable when every field its provider needs is filled in. */
export function isConfigComplete(config: LlmConfig): boolean {
  if (!config.model.trim()) return false
  if (PROVIDER_PRESETS[config.provider].requiresKey && !config.apiKey.trim())
    return false
  if (config.provider !== 'anthropic' && !config.baseUrl.trim()) return false
  return true
}
