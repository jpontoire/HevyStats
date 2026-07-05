import type { MuscleGroup } from './taxonomy'

/**
 * Keyword-based primary-muscle classifier for exercise titles.
 *
 * Hevy exports localize exercise names to the account's language, so the
 * rules cover French and English patterns on a normalized (lowercase,
 * accent-stripped) title. Rules are ordered: the first match wins, so
 * specific patterns ("leg curl" → hamstrings) must appear before generic
 * ones ("curl" → biceps). Unknown titles fall back to 'other' — the UI
 * offers AI classification and manual override for those.
 */
const RULES: [RegExp, MuscleGroup][] = [
  // Cardio first: "rameur"/"rowing machine" must beat back's "row".
  // No bare "walk": it would catch Farmer's Walk and Walking Lunge.
  [/\b(course|running|run|tapis|treadmill|velo|bike|cycling|cyclisme|rameur|rowing machine|row erg|elliptique|elliptical|corde a sauter|jump rope|stair|escalier|natation|swim)/, 'cardio'],

  // Legs specifics before arm "curl"
  [/leg curl|ischio|hamstring|roumain|romanian|good morning|nordic/, 'hamstrings'],
  [/hip thrust|fessier|glute|abduction|abducteur|pont|bridge|kickback jambe|donkey kick/, 'glutes'],
  [/mollet|calf|calves|tibia/, 'calves'],
  [/squat|presse|leg press|fente|lunge|extensions? (d'une |une )?jambes?|leg extension|goblet|bulgare|bulgarian|pistol|adduction|adducteur|step.?up/, 'quads'],

  // Triceps before chest ("dips banc") and before generic "extension"
  [/triceps|pushdown|barre au front|skull ?crusher|dips? banc|bench dip|prise serree|close grip|kickback/, 'triceps'],
  // "grip" alone is too greedy ("Row - V Grip"); rely on specific words
  [/poignet|wrist|farmer|fermier|fermiere|avant.?bras|forearm|suspension|dead hang|pince/, 'forearms'],
  // Arm curls before core: "Curl Marteau Oblique" is a curl, not oblique work
  [/curl|chin.?up/, 'biceps'],

  // Core before shoulders ("releve" vs "elevation" overlap risk)
  [/abdo|crunch|planche|plank|gainage|(re)?leve de (jambes?|genoux)|leg raise|knee raise|knee tuck|leg tuck|russian twist|rotation russe|dead ?bug|hollow|superman|sit.?up|l.?sit|ab wheel|mountain climber|obliques?|toes to bar|dragon flag/, 'core'],

  // Shoulders before chest ("developpe militaire" vs "developpe couche")
  [/militaire|military|overhead|shoulder|epaule|deltoide|delt|lateral|elevation|frontale?|front raise|arnold|face ?pull|oiseau|reverse fly|poirier|handstand|haussement|shrug|upright row|tirage menton/, 'shoulders'],

  [/couche|bench|chest|pec|ecarte|fly|crossover|pull.?over|pompes?|push.?up|dips?/, 'chest'],

  // Back last among the big groups: generic pulling patterns
  [/tirage|row(ing)?|traction|pull.?up|lat |lats|pulldown|dorsaux?|dos |souleve de terre|deadlift|hyperextension|lombaire|back extension|muscle.?up/, 'back'],
]

function normalize(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Best-effort primary muscle group for an exercise title; 'other' if unknown. */
export function classifyExercise(title: string): MuscleGroup {
  const normalized = normalize(title)
  for (const [pattern, group] of RULES) {
    if (pattern.test(normalized)) return group
  }
  return 'other'
}
