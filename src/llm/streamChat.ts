import { streamAnthropicChat } from './anthropic'
import { streamOpenAiCompatibleChat } from './openaiCompatible'
import type { StreamChatFn } from './types'

/** Route the request to the adapter matching the configured provider. */
export const streamChat: StreamChatFn = (params) =>
  params.config.provider === 'anthropic'
    ? streamAnthropicChat(params)
    : streamOpenAiCompatibleChat(params)
