<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import type { Course, CourseUnit } from "../../types"
import { sumUnitsWorkload } from "../../services/unitSchedule"
import { InvalidUnitsFileError, parseUnitsFromDocx } from "../../services/unitsDocxParser"

const props = defineProps<{
  course?: Course | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<Course, "id" | "createdAt" | "updatedAt">]
  cancel: []
}>()

interface CourseFormState {
  name: string
  description: string
  totalWorkloadHours: number
  isApprenticeship: boolean
  units: CourseUnit[]
  active: boolean
}

function defaultState(): CourseFormState {
  return {
    name: "",
    description: "",
    totalWorkloadHours: 0,
    isApprenticeship: false,
    units: [],
    active: true,
  }
}

function newUnit(overrides: Partial<CourseUnit> = {}): CourseUnit {
  return { id: `unit-${crypto.randomUUID()}`, name: "", workloadHours: 0, kind: "theory", ...overrides }
}

const form = reactive(defaultState())
const importError = ref("")
const importNotes = ref<string[]>([])
const submitError = ref("")

function resetFromProp(): void {
  const c = props.course
  if (c) {
    form.name = c.name
    form.description = c.description ?? ""
    form.totalWorkloadHours = c.totalWorkloadHours
    form.isApprenticeship = c.isApprenticeship ?? false
    form.units = (c.units ?? []).map((u) => ({ ...u }))
    form.active = c.active
  } else {
    Object.assign(form, defaultState())
  }
  importError.value = ""
  importNotes.value = []
  submitError.value = ""
}

watch(() => props.course, resetFromProp, { immediate: true })

const hasUnits = computed(() => form.units.length > 0)
const theoryHours = computed(() => sumUnitsWorkload(form.units.filter((u) => u.kind === "theory")))
const practiceHours = computed(() => sumUnitsWorkload(form.units.filter((u) => u.kind === "practice")))
/** Com UCs, a carga horária do curso é sempre a soma delas. */
const displayedTotal = computed(() => (hasUnits.value ? sumUnitsWorkload(form.units) : form.totalWorkloadHours))
const canBeApprenticeship = computed(() => theoryHours.value > 0 && practiceHours.value > 0)

function addUnit(): void {
  form.units.push(newUnit())
}

function removeUnit(index: number): void {
  const totalBefore = sumUnitsWorkload(form.units)
  form.units.splice(index, 1)
  // Sem nenhuma UC, o campo manual de carga horária volta a valer — começando da última soma.
  if (form.units.length === 0) form.totalWorkloadHours = totalBefore
  if (!canBeApprenticeship.value) form.isApprenticeship = false
}

function moveUnit(index: number, delta: -1 | 1): void {
  const target = index + delta
  if (target < 0 || target >= form.units.length) return
  const [moved] = form.units.splice(index, 1)
  form.units.splice(target, 0, moved)
}

async function handleImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = "" // permite escolher o mesmo arquivo de novo
  if (!file) return

  importError.value = ""
  importNotes.value = []
  try {
    const parsed = parseUnitsFromDocx(new Uint8Array(await file.arrayBuffer()))

    if (hasUnits.value && !window.confirm(`Substituir as ${form.units.length} UC(s) atuais pelas ${parsed.units.length} UC(s) do arquivo?`)) {
      return
    }

    form.units = parsed.units.map((u) => newUnit(u))
    if (!form.name.trim() && parsed.courseName) form.name = parsed.courseName

    const notes = [...parsed.warnings, `${parsed.units.length} UC(s) importada(s). A carga horária total do curso agora é a soma delas (${sumUnitsWorkload(form.units)}h).`]
    if (parsed.units.some((u) => u.kind === "practice")) {
      notes.push('A UC "Prática Profissional Supervisionada" foi marcada como Prática; confira o tipo de cada UC na lista.')
      if (/aprendizagem/i.test(`${parsed.courseName ?? ""} ${form.name}`)) {
        form.isApprenticeship = true
        notes.push('Marquei o curso como "Aprendizagem Profissional" (teoria e prática em paralelo). Desmarque abaixo se não for o caso.')
      }
    }
    importNotes.value = notes
  } catch (err) {
    importError.value = err instanceof InvalidUnitsFileError ? err.message : "Não foi possível ler o arquivo. Confira se é um documento Word (.docx)."
  }
}

function handleSubmit(): void {
  submitError.value = ""
  if (!form.name.trim()) return

  if (hasUnits.value) {
    if (form.units.some((u) => !u.name.trim() || !(u.workloadHours > 0))) {
      submitError.value = "Toda UC precisa de um nome e de uma carga horária maior que zero."
      return
    }
    if (form.isApprenticeship && !canBeApprenticeship.value) {
      submitError.value = "Um curso de Aprendizagem precisa de pelo menos uma UC de Teoria e uma de Prática."
      return
    }
  } else if (!form.totalWorkloadHours || form.totalWorkloadHours <= 0) {
    return
  }

  emit("submit", {
    name: form.name.trim(),
    description: form.description?.trim() ? form.description.trim() : undefined,
    totalWorkloadHours: hasUnits.value ? sumUnitsWorkload(form.units) : Number(form.totalWorkloadHours),
    isApprenticeship: hasUnits.value && form.isApprenticeship ? true : undefined,
    units: hasUnits.value ? form.units.map((u) => ({ ...u, name: u.name.trim(), workloadHours: Number(u.workloadHours) })) : undefined,
    active: form.active,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-name">Nome *</label>
      <input
        id="course-name"
        v-model="form.name"
        type="text"
        required
        placeholder="Nome do curso"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-description">Descrição</label>
      <textarea
        id="course-description"
        v-model="form.description"
        rows="3"
        placeholder="opcional"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      ></textarea>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-workload">Carga horária total (horas) *</label>
      <input
        id="course-workload"
        v-if="!hasUnits"
        v-model.number="form.totalWorkloadHours"
        type="number"
        min="1"
        step="1"
        required
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-48"
      />
      <p v-else id="course-workload" class="text-sm text-slate-800 dark:text-slate-100">
        <span class="font-semibold">{{ displayedTotal }}h</span>
        <span class="text-slate-500 dark:text-slate-400"> — soma das UCs (Teoria {{ theoryHours }}h · Prática {{ practiceHours }}h)</span>
      </p>
    </div>

    <section class="space-y-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">Unidades Curriculares (UCs)</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Opcional. Se o curso tem UCs, a carga horária total passa a ser a soma delas e a turma mostra as datas de cada UC, na ordem abaixo.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            for="course-units-file"
            class="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Importar do Word (.docx)
          </label>
          <input id="course-units-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="sr-only" @change="handleImportFile" />
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="addUnit"
          >
            + Adicionar UC
          </button>
        </div>
      </div>

      <p v-if="importError" class="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{{ importError }}</p>
      <ul v-if="importNotes.length > 0" class="space-y-1 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
        <li v-for="note in importNotes" :key="note">{{ note }}</li>
      </ul>

      <ol v-if="hasUnits" class="space-y-2">
        <li v-for="(unit, index) in form.units" :key="unit.id" class="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[2rem_1fr_6rem_8rem_auto]">
          <span class="hidden text-right text-xs text-slate-500 dark:text-slate-400 sm:block">{{ index + 1 }}</span>
          <input
            v-model="unit.name"
            type="text"
            :aria-label="`Nome da UC ${index + 1}`"
            placeholder="Nome da UC"
            class="col-span-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:col-span-1"
          />
          <input
            v-model.number="unit.workloadHours"
            type="number"
            min="0.5"
            step="0.5"
            :aria-label="`Carga horária da UC ${index + 1} (horas)`"
            placeholder="CH"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            v-model="unit.kind"
            :aria-label="`Tipo da UC ${index + 1}`"
            class="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="theory">Teoria</option>
            <option value="practice">Prática</option>
          </select>
          <div class="col-span-2 flex justify-end gap-1 sm:col-span-1">
            <button type="button" class="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700" :disabled="index === 0" :aria-label="`Mover UC ${index + 1} para cima`" @click="moveUnit(index, -1)">↑</button>
            <button type="button" class="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700" :disabled="index === form.units.length - 1" :aria-label="`Mover UC ${index + 1} para baixo`" @click="moveUnit(index, 1)">↓</button>
            <button type="button" class="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" :aria-label="`Remover UC ${index + 1}`" @click="removeUnit(index)">✕</button>
          </div>
        </li>
      </ol>

      <div v-if="hasUnits" class="space-y-1 border-t border-slate-200 pt-3 dark:border-slate-700">
        <div class="flex items-start gap-2">
          <input
            id="course-apprenticeship"
            v-model="form.isApprenticeship"
            type="checkbox"
            :disabled="!canBeApprenticeship"
            class="mt-0.5 h-4 w-4 rounded border-slate-300 disabled:opacity-40 dark:border-slate-600"
          />
          <label for="course-apprenticeship" class="text-sm text-slate-700 dark:text-slate-300">
            <span class="font-medium">Curso de Aprendizagem Profissional</span>
            <span class="block text-xs text-slate-500 dark:text-slate-400">
              Teoria (no SENAC) e prática (na empresa) correm em paralelo: começa com 10 dias úteis seguidos de teoria; depois os dias de teoria da turma são
              teoria e os demais dias úteis são prática. Exige pelo menos uma UC de Teoria e uma de Prática.
            </span>
          </label>
        </div>
        <p v-if="course" class="text-xs text-slate-500 dark:text-slate-400">
          Turmas já cadastradas deste curso não são recalculadas automaticamente: abra a turma e salve novamente para aplicar as mudanças.
        </p>
      </div>
    </section>

    <div class="flex items-center gap-2">
      <input id="course-active" v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
      <label for="course-active" class="text-sm font-medium text-slate-700 dark:text-slate-300">Ativo</label>
    </div>

    <p v-if="submitError" class="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{{ submitError }}</p>

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
      >
        Salvar
      </button>
    </div>
  </form>
</template>
