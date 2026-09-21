import type { CourseUnit } from "../types"

export interface UnitScheduleEntry {
  unit: CourseUnit
  /** Primeira aula da UC, "YYYY-MM-DD". null se a UC não tem carga horária ou está além do cronograma. */
  startDate: string | null
  /** Última aula da UC, "YYYY-MM-DD". null nos mesmos casos de `startDate`. */
  endDate: string | null
}

/** Soma da carga horária das UCs (referência para `Course.totalWorkloadHours`). */
export function sumUnitsWorkload(units: readonly Pick<CourseUnit, "workloadHours">[]): number {
  const total = units.reduce((sum, u) => sum + (u.workloadHours > 0 ? u.workloadHours : 0), 0)
  return Math.round(total * 100) / 100
}

/**
 * Distribui as UCs, em sequência, sobre as datas de aula já calculadas pelo
 * `calendarEngine` (`classDates`, cada uma valendo `dailyWorkloadHours`).
 *
 * As horas de cada UC são consumidas na ordem em que as UCs aparecem; uma UC
 * começa na aula em que a anterior terminou (ou na seguinte, se aquela aula foi
 * totalmente consumida) e termina na aula em que sua última hora é cumprida.
 * Uma mesma data pode ser o fim de uma UC e o início da próxima quando a carga
 * da UC não é múltipla da carga diária.
 *
 * Isto trata TODAS as UCs como uma única sequência, no mesmo calendário da
 * turma (cursos comuns). Em turmas de Aprendizagem, teoria e prática correm
 * em paralelo — use `computeClassGroupUnitSchedule`, que separa as duas.
 */
export function computeUnitSchedule(
  classDates: readonly string[],
  dailyWorkloadHours: number,
  units: readonly CourseUnit[],
): UnitScheduleEntry[] {
  // Trabalha em centésimos de hora para evitar erro de ponto flutuante (ex: 0.1 + 0.2).
  const scale = (hours: number) => Math.round(hours * 100)
  const dailyScaled = scale(dailyWorkloadHours)

  let consumedScaled = 0
  return units.map((unit) => {
    const unitScaled = scale(unit.workloadHours)
    if (unitScaled <= 0 || dailyScaled <= 0) {
      return { unit, startDate: null, endDate: null }
    }

    const firstIndex = Math.floor(consumedScaled / dailyScaled)
    consumedScaled += unitScaled
    const lastIndex = Math.ceil(consumedScaled / dailyScaled) - 1

    const startDate = classDates[firstIndex] ?? null
    const endDate = startDate === null ? null : classDates[Math.min(lastIndex, classDates.length - 1)]
    return { unit, startDate, endDate }
  })
}

export interface ClassGroupUnitScheduleSource {
  /** Datas de aula (em turmas de Aprendizagem, só as de teoria). */
  classDates: readonly string[]
  /** Horas por dia de aula (em turmas de Aprendizagem, da teoria). */
  dailyWorkloadHours: number
  /** Só em turmas de Aprendizagem: datas de prática e horas por dia de prática. */
  practiceDates?: readonly string[]
  practiceDailyHours?: number
}

/**
 * Datas de cada UC de uma turma. Em cursos comuns, todas as UCs seguem em
 * sequência sobre as aulas da turma. Em turmas de Aprendizagem
 * (`practiceDates` definido), as UCs de teoria seguem em sequência sobre as
 * datas de teoria e as de prática sobre as datas de prática. O resultado
 * mantém a ordem original de `units`.
 */
export function computeClassGroupUnitSchedule(
  source: ClassGroupUnitScheduleSource,
  units: readonly CourseUnit[],
): UnitScheduleEntry[] {
  if (source.practiceDates === undefined) {
    return computeUnitSchedule(source.classDates, source.dailyWorkloadHours, units)
  }

  const theory = computeUnitSchedule(source.classDates, source.dailyWorkloadHours, units.filter((u) => u.kind === "theory"))
  const practice = computeUnitSchedule(
    source.practiceDates,
    source.practiceDailyHours ?? 0,
    units.filter((u) => u.kind === "practice"),
  )
  const byUnitId = new Map([...theory, ...practice].map((entry) => [entry.unit.id, entry]))
  return units.map((unit) => byUnitId.get(unit.id)!)
}
