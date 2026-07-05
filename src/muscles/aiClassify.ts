import { db } from '../db/db'
import { streamChat } from '../llm/streamChat'
import type { LlmConfig } from '../llm/types'
import { isMuscleGroup, MUSCLE_GROUPS, type MuscleGroup } from './taxonomy'

const PROMPT_HEADER = `You classify gym exercises by primary muscle group. Exercise names may be in any language (French, English, German…).

Allowed groups: ${MUSCLE_GROUPS.filter((g) => g !== 'other').join(', ')}.

Reply with a JSON object only — no prose, no code fences — mapping each exercise name (exactly as given) to one allowed group. Example:
{"Développé Couché (Haltère)": "chest", "Lat Pulldown": "back"}

Exercises to classify:
`

function extractJson(text: string): Record<string, string> {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new Error('The model did not return the expected JSON mapping.')
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, string>
}

/**
 * Ask the configured LLM to classify the given exercise titles and store
 * the valid results (without touching manual overrides). Returns the number
 * of assignments saved.
 */
export async function classifyWithAi(
  config: LlmConfig,
  titles: string[],
): Promise<number> {
  if (titles.length === 0) return 0

  const text = await streamChat({
    config,
    system: 'You are a precise data-labeling assistant.',
    messages: [
      {
        role: 'user',
        content: PROMPT_HEADER + titles.map((t) => `- ${t}`).join('\n'),
      },
    ],
    onDelta: () => {},
  })

  const mapping = extractJson(text)
  const wanted = new Set(titles)
  const assignments: { title: string; group: MuscleGroup }[] = []
  for (const [title, group] of Object.entries(mapping)) {
    const normalized = group.trim().toLowerCase()
    if (wanted.has(title) && isMuscleGroup(normalized) && normalized !== 'other') {
      assignments.push({ title, group: normalized })
    }
  }
  if (assignments.length === 0) {
    throw new Error('The model returned no usable classification.')
  }

  let saved = 0
  await db.transaction('rw', db.muscleMap, async () => {
    for (const { title, group } of assignments) {
      const existing = await db.muscleMap.get(title)
      if (existing?.source === 'manual') continue
      await db.muscleMap.put({ title, group, source: 'ai' })
      saved++
    }
  })
  return saved
}
