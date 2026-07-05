import type { MuscleAssignment } from '../db/db'
import { classifyExercise } from './classify'
import type { MuscleGroup } from './taxonomy'

/**
 * Build a title → muscle group resolver from the stored assignments
 * (AI results and manual overrides win over the keyword heuristic).
 */
export function makeMuscleResolver(
  overrides: MuscleAssignment[],
): (title: string) => MuscleGroup {
  const byTitle = new Map(overrides.map((o) => [o.title, o.group]))
  return (title) => byTitle.get(title) ?? classifyExercise(title)
}
