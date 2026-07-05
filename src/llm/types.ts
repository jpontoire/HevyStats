export type ProviderId = 'anthropic' | 'openai' | 'ollama' | 'custom'

/** BYOK connection settings, persisted in localStorage only. */
export interface LlmConfig {
  provider: ProviderId
  /** Optional for local endpoints like Ollama. */
  apiKey: string
  model: string
  /** Base URL of the OpenAI-compatible API; unused for Anthropic. */
  baseUrl: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamChatParams {
  config: LlmConfig
  system: string
  messages: ChatTurn[]
  /** Called with each streamed text fragment. */
  onDelta: (text: string) => void
}

/** Streams one assistant reply and resolves with the full text. */
export type StreamChatFn = (params: StreamChatParams) => Promise<string>
