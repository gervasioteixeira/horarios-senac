/**
 * Modelo de dados do sistema.
 *
 * Estas interfaces fazem o papel que, em uma stack Laravel, seria
 * coberto por Migrations + Models. Aqui elas são o contrato dos dados
 * persistidos em JSON no localStorage (ver services/backup.ts e
 * composables/useLocalStorage.ts).
 */

/** Dias da semana usados no agendamento de turmas (nunca inclui domingo = 0). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6

export type TimePeriod = "morning" | "afternoon" | "evening"

/** Uma das faixas de horário estritas permitidas pela regra de negócio 2. */
export interface TimeSlot {
  period: TimePeriod
  /** Hora de início no formato "HH:mm". */
  start: string
  /** Hora de término no formato "HH:mm". */
  end: string
}

export interface Teacher {
  id: string
  name: string
  email?: string
  phone?: string
  /** Cor hexadecimal (ex: "#3b82f6") usada para destacar o professor no calendário. */
  colorHex: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  name: string
  description?: string
  /** Carga horária total do curso, em horas (ex: 160). */
  totalWorkloadHours: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type HolidayScope = "national" | "state" | "municipal" | "custom"

export interface Holiday {
  id: string
  /** Data no formato "YYYY-MM-DD". */
  date: string
  name: string
  scope: HolidayScope
  /**
   * Feriados recorrentes (nacionais fixos/móveis) são gerados
   * automaticamente ano a ano pelo holidayEngine e não precisam ser
   * recriados manualmente; feriados customizados são fixos numa data.
   */
  recurring: boolean
}

export interface MonthlyBreakdownEntry {
  year: number
  /** Mês 1-12. */
  month: number
  classesCount: number
  hoursCount: number
}

export type ClassGroupStatus = "planned" | "ongoing" | "finished" | "cancelled"

export interface ClassGroup {
  id: string
  courseId: string
  teacherId: string
  name: string
  /** Data de início no formato "YYYY-MM-DD". */
  startDate: string
  /** Carga horária cursada por dia de aula, em horas (ex: 4). */
  dailyWorkloadHours: number
  weekdays: Weekday[]
  timeSlot: TimeSlot
  status: ClassGroupStatus

  /** Campos calculados pelo calendarEngine — recalculados a cada alteração relevante. */
  computedEndDate: string | null
  computedMonthlyBreakdown: MonthlyBreakdownEntry[]
  computedClassDates: string[]

  createdAt: string
  updatedAt: string
}

/** Payload completo exportado/importado pelo botão de backup. */
export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  data: {
    teachers: Teacher[]
    courses: Course[]
    holidays: Holiday[]
    classGroups: ClassGroup[]
  }
}
