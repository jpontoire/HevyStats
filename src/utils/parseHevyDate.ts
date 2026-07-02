/**
 * Hevy CSV exports format dates with the locale of the account, e.g.
 * "30 juin 2026, 18:21" (fr) or "30 Jun 2026, 18:21" (en).
 * `new Date()` cannot parse the French form, so month names are mapped by hand.
 */
const MONTHS: Record<string, number> = {
  // French (abbreviations appear with a trailing dot in exports, stripped below)
  janv: 0,
  janvier: 0,
  févr: 1,
  fevr: 1,
  février: 1,
  fevrier: 1,
  mars: 2,
  avr: 3,
  avril: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  juillet: 6,
  août: 7,
  aout: 7,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  déc: 11,
  dec: 11,
  décembre: 11,
  decembre: 11,
  // English
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

const DAY_MONTH_YEAR = /^(\d{1,2})\s+(\S+)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})$/

/** Parse a Hevy export date. Returns null when the format is not recognized. */
export function parseHevyDate(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const match = trimmed.match(DAY_MONTH_YEAR)
  if (match) {
    const [, day, monthRaw, year, hours, minutes] = match
    const month = MONTHS[monthRaw!.toLowerCase().replace(/\.$/, '')]
    if (month !== undefined) {
      const date = new Date(
        Number(year),
        month,
        Number(day),
        Number(hours),
        Number(minutes),
      )
      return Number.isNaN(date.getTime()) ? null : date
    }
  }

  // Fallback for other locales/formats that the Date constructor understands
  const fallback = new Date(trimmed)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}
