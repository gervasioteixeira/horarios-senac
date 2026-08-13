# CLAUDE.md — horarios-senac

Este arquivo orienta sessões futuras do Claude Code trabalhando neste repositório.

## O que é este projeto

Sistema interno de gestão de cursos para uma empresa de formação (cliente), focado em:
agendar turmas, calcular automaticamente a data de término de cada turma e a distribuição
de aulas/horas por mês, evitar choque de horário de professores, e gerar PDFs de turma/professor.

**Professores não acessam o sistema.** É uma ferramenta de uso interno da equipe administrativa.

## Decisão de arquitetura (importante — não reintroduzir Laravel/PHP)

O pedido original do cliente citava Laravel + MySQL, mas também pedia hospedagem gratuita em
**GitHub Pages** com dados salvos no **localStorage** do navegador da cliente, mais botões de
export/import (download/upload de JSON). Como GitHub Pages só serve arquivos estáticos (sem PHP/
back-end), foi decidido substituir Laravel por uma **SPA Vue 3 pura**: toda a lógica de negócio
(motor de calendário, feriados, validação de conflito de horário) roda em TypeScript no navegador,
sem servidor, sem API, sem banco de dados relacional.

**Não sugira migrar para Laravel/back-end a menos que o usuário peça explicitamente.** Essa
decisão já foi tomada e confirmada com o cliente.

## Stack

- Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript
- Tailwind CSS **v4** (atenção: v4 usa `@import "tailwindcss"` no CSS + plugin `@tailwindcss/postcss`
  no `postcss.config.js` — **não** há `tailwind.config.js` tradicional nem diretivas `@tailwind base/
  components/utilities`)
- Pinia (stores com Composition API — `defineStore("nome", () => {...})`, não Options API)
- vue-router com **hash history** (`createWebHashHistory`) — propositalmente, porque GitHub Pages
  não tem como fazer rewrite de servidor para history mode sem um `404.html` de fallback
- date-fns (utilidades de data quando necessário; o motor de calendário em si é feito com `Date` nativo em UTC)
- jsPDF + jspdf-autotable (geração de PDF client-side). **Atenção:** versões instaladas são jsPDF 4.x
  e jspdf-autotable 5.x, cuja API mudou da tradicional `doc.autoTable(...)` para `autoTable(doc, options)`
  função importada, e para encadear tabelas usando o Y final da anterior é preciso usar
  `__createTable`/`__drawTable` (retornam um `Table` com `.finalY`), não `doc.lastAutoTable`.
- Vitest + @vue/test-utils para testes

## Comandos

```bash
npm install        # instalar dependências
npm run dev         # servidor de desenvolvimento
npm run build        # build de produção (roda vue-tsc -b antes)
npm run preview       # servir o build localmente
npm run test         # rodar toda a suite de testes uma vez
npm run test:watch      # rodar testes em modo watch
```

**Atenção Windows/Vitest:** o pool padrão de workers do Vitest (`forks`) trava/dá timeout neste
ambiente Windows. `vite.config.ts` já está configurado com `test.pool: "threads"` — não remova
essa configuração nem volte para `forks` sem testar antes.

## Estrutura de pastas

```
src/
  types/index.ts         # TODO o modelo de dados (Teacher, Course, Holiday, ClassGroup, TimeSlot, ...)
  constants/schedule.ts    # ALLOWED_TIME_SLOTS (horários estritos permitidos), labels de dias da semana
  services/            # lógica de negócio pura (sem Vue, testável isoladamente)
    calendarEngine.ts     # calcula data de término e distribuição mensal de aulas
    holidayEngine.ts      # feriados nacionais (fixos + móveis via algoritmo de Gauss para Páscoa)
    conflictChecker.ts     # detecta choque de horário do mesmo professor
    backup.ts          # export/import JSON (download/upload)
    pdfGenerator.ts       # geração de PDF de turma e de professor
  stores/              # Pinia — cada store persiste automaticamente no localStorage
    teachers.ts, courses.ts, holidays.ts, classGroups.ts
  composables/useLocalStorage.ts # helpers de leitura/escrita/persistência automática no localStorage
  components/forms/       # ClassGroupForm, CourseForm, TeacherForm, HolidayForm
  components/calendar/     # MonthlyBreakdown (tabela), ClassCalendarView (visões dia/semana/mês/semestre/ano, colorido por professor)
  components/shared/      # BackupControls (export/import JSON), AppMaintenanceControls (limpar dados + forçar atualização), ConflictWarning
  views/               # DashboardView, CoursesView, ClassGroupsView, TeachersView, HolidaysView
  router/index.ts
tests/unit/*.spec.ts       # testes dos services/ (ver seção "Regra de testes" abaixo)
docs/MANUAL-DO-USUARIO.md    # manual em PT-BR para a cliente (não-técnica)
.github/workflows/deploy.yml   # build + testes + deploy automático no GitHub Pages a cada push em main
```

## Modelo de dados (resumo — ver `src/types/index.ts` para os tipos completos)

- **Teacher**: professor — nome, contato opcional, `colorHex` (cor usada no calendário), ativo.
- **Course**: curso — é um *template* (nome, carga horária total, ementa). Pode ter várias Turmas.
- **ClassGroup** (turma): é a *instância* real — curso, professor, data de início, carga horária
  diária, dias da semana, faixa de horário. Guarda os campos calculados: `computedEndDate`,
  `computedMonthlyBreakdown`, `computedClassDates` (recalculados pelo `calendarEngine` sempre que
  a turma é salva).
- **Holiday**: feriado — nacional (gerado automaticamente) ou customizado (estadual/municipal/
  ponto facultativo, cadastrado manualmente pela cliente).

## Onde vive cada regra de negócio

| Regra | Arquivo |
|---|---|
| Cálculo de data de término e distribuição mensal, pulando domingos/dias não letivos/feriados | `src/services/calendarEngine.ts` (`calculateSchedule`) |
| Feriados nacionais fixos e móveis (Páscoa, Carnaval, Corpus Christi) | `src/services/holidayEngine.ts` |
| Faixas de horário estritas permitidas (manhã/tarde/noite) | `src/constants/schedule.ts` (`ALLOWED_TIME_SLOTS`) — o formulário deve sempre usar essa lista, nunca aceitar horário livre |
| Bloqueio de choque de horário do mesmo professor | `src/services/conflictChecker.ts` (`findScheduleConflict`) — chamado dentro de `classGroups.ts` store no `save()`, que bloqueia e retorna o conflito em vez de salvar |
| Cor do professor refletida no calendário | `Teacher.colorHex`, consumido em `ClassCalendarView.vue` via `:style` (Tailwind não gera classes para hex arbitrário em runtime) |
| Visões de calendário (dia/semana/mês/semestre/ano) | `ClassCalendarView.vue` — um único componente com `viewMode` local; semestre/ano mostram mini-meses clicáveis que abrem a visão de mês |
| Limpar todos os dados salvos / forçar atualização do app | `src/components/shared/AppMaintenanceControls.vue`, fixo na sidebar (`App.vue`). "Limpar dados" exige dupla confirmação e usa `clearAllLocalStorage` de `useLocalStorage.ts`. "Buscar atualizações" limpa Cache API/Service Worker (se existirem) e recarrega com um query param de cache-busting — não apaga dados |

## Regra de testes (evitar regressão)

**Toda nova funcionalidade ou alteração que tocar algo em `src/services/` deve vir acompanhada de
teste(s) em `tests/unit/` cobrindo o caso novo, e `npm run test` deve passar antes de considerar a
tarefa concluída.** Esse é o núcleo mais sensível a bugs sutis (datas, feriados móveis, sobreposição
de horários) — cobertura de teste aqui é obrigatória, não opcional.

Casos já cobertos (não remover sem substituir por algo equivalente):
- `calendarEngine.spec.ts`: caso simples, feriado no meio, virada de mês/ano, proteção contra domingo/weekdays vazio.
- `holidayEngine.spec.ts`: Páscoa em anos conhecidos, feriados fixos, feriados móveis derivados, merge com customizados.
- `conflictChecker.spec.ts`: sobreposição de horário/dia, sem sobreposição de dia, horários adjacentes sem overlap, vigências não cruzadas, professores diferentes, turmas canceladas ignoradas, edição da própria turma.
- `backup.spec.ts`: export contém todas as entidades, roundtrip export→import, rejeição de JSON malformado/incompleto/versão futura.

## Persistência (localStorage)

Cada store Pinia usa `useLocalStorage.ts` para ler o estado inicial do localStorage e persistir
automaticamente (via `watch` profundo) a cada alteração. Chaves usam o prefixo `horarios-senac:`.
Não há backend — **é o único lugar onde os dados da cliente existem**, por isso o botão de backup
(`BackupControls.vue` + `services/backup.ts`) é crítico: gera um único JSON com todas as entidades
e permite reimportar em outro navegador/computador.

## Deploy

Push na branch `main` → GitHub Actions (`.github/workflows/deploy.yml`) roda os testes, faz o build
e publica em GitHub Pages. `vite.config.ts` tem `base: "/horarios-senac/"` fixo — se o nome do
repositório no GitHub mudar, esse valor precisa mudar junto.

## Status do projeto

**MVP completo e funcional** (13/08/2026). Todas as telas, serviços e testes descritos neste
documento existem e passam:

- `npx vue-tsc -b --noEmit` — sem erros de tipo
- `npx vitest run` — 23 testes, 4 arquivos, todos passando
- `npm run build` — build de produção OK

Implementado:
- `src/types/index.ts`, `src/constants/schedule.ts`
- `src/services/{calendarEngine,holidayEngine,conflictChecker,backup,pdfGenerator}.ts` + testes dos 4 primeiros
- `src/stores/{teachers,courses,holidays,classGroups}.ts` (Pinia, persistência automática em localStorage)
- `src/composables/useLocalStorage.ts`
- `src/components/forms/{TeacherForm,CourseForm,HolidayForm,ClassGroupForm}.vue`
- `src/components/calendar/{MonthlyBreakdown,ClassCalendarView}.vue`
- `src/components/shared/{ConflictWarning,BackupControls}.vue`
- `src/views/{DashboardView,CoursesView,ClassGroupsView,TeachersView,HolidaysView}.vue`
- Botões de "Baixar PDF" funcionais em Turmas (PDF da turma) e Professores (PDF do professor)
- `BackupControls.vue` fixo na sidebar (`App.vue`), disponível em qualquer tela
- `.github/workflows/deploy.yml` (build + test + deploy no push em `main`)
- `docs/MANUAL-DO-USUARIO.md`

**Pendente / próximos passos possíveis** (não implementado ainda, não assumir que existe):
- Testes de componente (`@vue/test-utils`) — hoje a suite cobre só `services/`, que é o núcleo crítico
- Edição/exclusão de status da turma (`ongoing`/`finished`) não tem UI dedicada além do campo cru
- Repositório git ainda não inicializado neste diretório até a etapa de Git/GitHub ser conduzida com o usuário

Em caso de dúvida sobre o que está funcional, rode `npm run test` e `npm run build`.
