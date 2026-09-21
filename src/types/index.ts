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

/**
 * Natureza de uma Unidade Curricular. "practice" é a prática (ex: Prática
 * Profissional Supervisionada, feita na empresa em cursos de Aprendizagem);
 * as demais são "theory". Só tem efeito no cronograma quando o curso é de
 * Aprendizagem (`Course.isApprenticeship`) — ver apprenticeshipEngine.ts.
 */
export type CourseUnitKind = "theory" | "practice"

/** Unidade Curricular (UC): uma parte do curso com nome e carga horária próprios. */
export interface CourseUnit {
  id: string
  name: string
  /** Carga horária da UC, em horas. */
  workloadHours: number
  kind: CourseUnitKind
}

export interface Course {
  id: string
  name: string
  description?: string
  /**
   * Carga horária total do curso, em horas (ex: 160). Quando o curso tem
   * `units`, é sempre a soma delas (o formulário mantém os dois em sincronia).
   */
  totalWorkloadHours: number
  /**
   * Curso de Aprendizagem Profissional: teoria (UCs "theory", no SENAC) e prática
   * (UCs "practice", na empresa) correm em paralelo, com a regra dos 10 primeiros
   * dias seguidos de teoria. Exige `units` com pelo menos uma UC de cada tipo.
   */
  isApprenticeship?: boolean
  /**
   * UCs do curso, em ordem de execução. Opcional — cursos cadastrados antes
   * deste campo, ou sem divisão em UCs, omitem o campo.
   */
  units?: CourseUnit[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  name: string
  /** Localização/prédio/bloco (opcional), útil quando há vários espaços com nomes parecidos. */
  location?: string
  /** Capacidade máxima de alunos que o espaço comporta. */
  capacity: number
  active: boolean
  createdAt: string
  updatedAt: string
}

/**
 * "recess" é um recesso escolar: um PERÍODO (`date` a `endDate`), não um dia
 * de folga geral. Só afeta cursos de Aprendizagem (ver apprenticeshipEngine.ts);
 * cursos comuns o ignoram.
 */
export type HolidayScope = "national" | "state" | "municipal" | "custom" | "recess"

export interface Holiday {
  id: string
  /** Data no formato "YYYY-MM-DD". Para recessos (`scope: "recess"`), é o primeiro dia do período. */
  date: string
  /** Último dia do período, "YYYY-MM-DD". Só é usado (e obrigatório) quando `scope` é "recess". */
  endDate?: string
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
  /** Só em turmas de Aprendizagem: dias e horas de prática (na empresa) no mês. `classesCount`/`hoursCount` passam a ser só a teoria. */
  practiceClassesCount?: number
  practiceHoursCount?: number
}

export type ClassGroupStatus = "planned" | "ongoing" | "finished" | "cancelled"

/**
 * Ajuste pontual de calendário aplicado a partir de uma aula específica
 * (ex: professor faltou uma semana). Aulas ANTERIORES a `fromDate` no
 * cronograma nunca mudam; a aula em `fromDate` e todas as seguintes
 * deslocam `shiftDays` dias corridos, continuando a respeitar os dias
 * da semana da turma (ver calendarEngine.ts). Diferente de mover a
 * turma inteira (que altera `startDate`), o adiamento não mexe no
 * início da turma nem nas aulas já dadas.
 */
export interface ClassPostponement {
  /** Data (no cronograma calculado sem este ajuste) a partir da qual o deslocamento passa a valer. */
  fromDate: string
  /** Dias corridos a deslocar a aula em `fromDate` e as seguintes. Sempre positivo (adiamento). */
  shiftDays: number
}

export interface ClassGroup {
  id: string
  courseId: string
  teacherId: string
  /**
   * Espaço físico (sala/laboratório/auditório) onde a turma acontece.
   * Opcional para não invalidar turmas cadastradas antes deste campo
   * existir — mas quando preenchido, entra na checagem de conflito de
   * horário (a mesma sala não pode ter duas turmas no mesmo horário)
   * e na validação de capacidade (ver `expectedStudents`).
   */
  roomId?: string
  /** Número de alunos previstos para a turma, usado para validar contra a capacidade do espaço. */
  expectedStudents?: number
  name: string
  /** Data de início no formato "YYYY-MM-DD". */
  startDate: string
  /** Carga horária cursada por dia de aula, em horas (ex: 4). Em turmas de Aprendizagem, é a carga diária da TEORIA. */
  dailyWorkloadHours: number
  /** Só em turmas de Aprendizagem: carga horária cursada por dia de PRÁTICA (na empresa), em horas. */
  practiceDailyHours?: number
  /** Dias da semana de aula. Em turmas de Aprendizagem, são os dias de TEORIA; a prática ocupa os demais dias úteis (seg-sex). */
  weekdays: Weekday[]
  timeSlot: TimeSlot
  status: ClassGroupStatus
  /**
   * Ajustes pontuais de calendário (ex: professor faltou uma semana),
   * aplicados em ordem cronológica de `fromDate`. Opcional — turmas sem
   * nenhum ajuste omitem o campo ou têm lista vazia.
   */
  postponements?: ClassPostponement[]

  /**
   * Previsão de encerramento "de referência": a `computedEndDate` de quando a
   * turma foi salva/replanejada pela última vez (formulário ou mover turma
   * inteira). Adiamentos pontuais NÃO a alteram — a diferença entre ela e
   * `computedEndDate` é o atraso acumulado (ver services/endDateForecast.ts).
   * Opcional para turmas cadastradas antes deste campo existir.
   */
  originalEndDate?: string | null

  /** Campos calculados pelo calendarEngine — recalculados a cada alteração relevante. */
  computedEndDate: string | null
  computedMonthlyBreakdown: MonthlyBreakdownEntry[]
  /** Datas de aula. Em turmas de Aprendizagem, só as de TEORIA (presenciais no SENAC). */
  computedClassDates: string[]
  /** Só em turmas de Aprendizagem: datas de prática (na empresa). Não ocupam professor nem espaço. */
  computedPracticeDates?: string[]

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
    rooms: Room[]
  }
}
