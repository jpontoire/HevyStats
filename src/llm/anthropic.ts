import Anthropic from '@anthropic-ai/sdk'
import type { StreamChatFn } from './types'

// Adaptive thinking is only accepted by these model families; sending it to
// an older model (e.g. Haiku 4.5) would 400.
const ADAPTIVE_THINKING_MODELS =
  /claude-(fable-5|mythos-5|opus-4-[678]|sonnet-5|sonnet-4-6)/

function describeError(cause: unknown): Error {
  if (cause instanceof Anthropic.AuthenticationError) {
    return new Error('Invalid Anthropic API key. Check it in the settings.')
  }
  if (cause instanceof Anthropic.NotFoundError) {
    return new Error('Unknown Anthropic model. Check the model name.')
  }
  if (cause instanceof Anthropic.RateLimitError) {
    return new Error(
      'Rate limit reached on your Anthropic account. Try again in a minute.',
    )
  }
  if (cause instanceof Anthropic.APIConnectionError) {
    return new Error('Could not reach the Anthropic API. Check your connection.')
  }
  if (cause instanceof Anthropic.APIError) {
    return new Error(`Anthropic API error (${cause.status}): ${cause.message}`)
  }
  return cause instanceof Error ? cause : new Error(String(cause))
}

/** Claude via the official SDK — BYOK, browser-direct. */
export const streamAnthropicChat: StreamChatFn = async ({
  config,
  system,
  messages,
  onDelta,
}) => {
  const client = new Anthropic({
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const stream = client.messages.stream({
      model: config.model,
      max_tokens: 64000,
      ...(ADAPTIVE_THINKING_MODELS.test(config.model)
        ? { thinking: { type: 'adaptive' as const } }
        : {}),
      system: [
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    })

    stream.on('text', onDelta)
    const final = await stream.finalMessage()
    const answer = final.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    if (final.stop_reason === 'refusal' && !answer) {
      throw new Error('The model declined to answer this request.')
    }
    return answer
  } catch (cause) {
    throw describeError(cause)
  }
}
