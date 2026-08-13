import type { Holiday } from "../types"

/**
 * Feriados nacionais fixos do Brasil (mesma data todo ano).
 * month é 1-12 (não 0-11) para casar com o resto do sistema.
 */
const FIXED_NATIONAL_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: "Confraternização Universal" },
  { month: 4, day: 21, name: "Tiradentes" },
  { month: 5, day: 1, name: "Dia do Trabalho" },
  { month: 9, day: 7, name: "Independência do Brasil" },
  { month: 10, day: 12, name: "Nossa Senhora Aparecida" },
  { month: 11, day: 2, name: "Finados" },
  { month: 11, day: 15, name: "Proclamação da República" },
  { month: 12, day: 25, name: "Natal" },
]

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/**
 * Calcula a data da Páscoa (domingo) para um dado ano, usando o
 * algoritmo de Gauss/Meeus (calendário gregoriano).
 * Retorna { month, day } com month em 1-12.
 */
export function calculateEasterDate(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function addDaysToDate(year: number, month: number, day: number, delta: number): { year: number; month: number; day: number } {
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + delta)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

/**
 * Gera os feriados nacionais (fixos + móveis) para um ano específico.
 * Móveis: Sexta-feira Santa (Páscoa - 2), Carnaval (Páscoa - 47, terça-feira)
 * e Corpus Christi (Páscoa + 60).
 */
export function generateNationalHolidaysForYear(year: number): Holiday[] {
  const easter = calculateEasterDate(year)
  const goodFriday = addDaysToDate(year, easter.month, easter.day, -2)
  const carnival = addDaysToDate(year, easter.month, easter.day, -47)
  const corpusChristi = addDaysToDate(year, easter.month, easter.day, 60)

  const holidays: Holiday[] = FIXED_NATIONAL_HOLIDAYS.map((h) => ({
    id: `national-fixed-${year}-${h.month}-${h.day}`,
    date: toIsoDate(year, h.month, h.day),
    name: h.name,
    scope: "national",
    recurring: true,
  }))

  holidays.push(
    {
      id: `national-easter-${year}`,
      date: toIsoDate(year, easter.month, easter.day),
      name: "Páscoa",
      scope: "national",
      recurring: true,
    },
    {
      id: `national-good-friday-${year}`,
      date: toIsoDate(goodFriday.year, goodFriday.month, goodFriday.day),
      name: "Sexta-feira Santa",
      scope: "national",
      recurring: true,
    },
    {
      id: `national-carnival-${year}`,
      date: toIsoDate(carnival.year, carnival.month, carnival.day),
      name: "Carnaval",
      scope: "national",
      recurring: true,
    },
    {
      id: `national-corpus-christi-${year}`,
      date: toIsoDate(corpusChristi.year, corpusChristi.month, corpusChristi.day),
      name: "Corpus Christi",
      scope: "national",
      recurring: true,
    },
  )

  return holidays.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Gera feriados nacionais para todos os anos entre startYear e endYear (inclusive).
 * Usado para garantir cobertura de feriados durante toda a vigência de uma turma.
 */
export function generateNationalHolidaysForYearRange(startYear: number, endYear: number): Holiday[] {
  const result: Holiday[] = []
  for (let year = startYear; year <= endYear; year++) {
    result.push(...generateNationalHolidaysForYear(year))
  }
  return result
}

/**
 * Mescla feriados nacionais gerados automaticamente com feriados
 * customizados cadastrados pela cliente (estaduais/municipais/pontos
 * facultativos), retornando o conjunto de datas (strings "YYYY-MM-DD")
 * a serem puladas pelo motor de calendário.
 */
export function mergeHolidayDates(nationalHolidays: Holiday[], customHolidays: Holiday[]): Set<string> {
  const dates = new Set<string>()
  for (const h of nationalHolidays) dates.add(h.date)
  for (const h of customHolidays) dates.add(h.date)
  return dates
}
