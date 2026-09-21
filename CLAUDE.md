# CLAUDE.md — horarios-senac

Este arquivo orienta sessões futuras do Claude Code trabalhando neste repositório.

## O que é este projeto

Sistema interno de gestão de cursos para uma empresa de formação (cliente), focado em:
agendar turmas, calcular automaticamente a data de término de cada turma e a distribuição
de aulas/horas por mês, evitar choque de horário de professores E de espaços físicos
(salas/laboratórios), validar capacidade de alunos por espaço, e gerar PDFs de turma/professor.

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
- fflate (descompactar o .docx no navegador em `unitsDocxParser.ts`; já era dependência transitiva do jsPDF, agora é explícita)
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
  constants/brand.ts     # BRAND_COLORS institucionais (extraídos da logo), ver seção "Identidade institucional"
  constants/format.ts     # formatDateBr — formatação de data ISO para pt-BR (dd/mm/aaaa) na UI
  composables/useTheme.ts   # preferência de tema claro/escuro/sistema, aplica classe .dark no <html>
  services/            # lógica de negócio pura (sem Vue, testável isoladamente)
    calendarEngine.ts     # calcula data de término e distribuição mensal de aulas (cursos comuns)
    apprenticeshipEngine.ts # calendário de Aprendizagem: teoria + prática em paralelo, 10 dias iniciais, recesso
    endDateForecast.ts    # atraso (dias) da previsão de encerramento após adiamentos
    unitSchedule.ts       # soma de carga das UCs e datas de início/fim de cada UC numa turma
    unitsDocxParser.ts    # lê a tabela de UCs de um .docx (fflate + DOMParser), sem servidor
    holidayEngine.ts      # feriados nacionais (fixos + móveis via algoritmo de Gauss para Páscoa)
    conflictChecker.ts     # detecta choque de horário (professor OU espaço) e capacidade excedida
    backup.ts          # export/import JSON (download/upload)
    pdfGenerator.ts       # geração de PDF de turma, de professor e do manual do usuário; INSTITUTIONAL_CREDITS e INSTITUTIONAL_LOGO_PATH centralizados aqui
  content/userManual.ts     # conteúdo estruturado (seções/parágrafos/listas) do manual, consumido pelo generateUserManualPdf
  stores/              # Pinia — cada store persiste automaticamente no localStorage
    teachers.ts, courses.ts, holidays.ts, classGroups.ts, rooms.ts
  composables/useLocalStorage.ts # helpers de leitura/escrita/persistência automática no localStorage
  components/forms/       # ClassGroupForm, CourseForm, TeacherForm, HolidayForm, RoomForm
  components/calendar/     # MonthlyBreakdown (tabela; colunas de prática em Aprendizagem), UnitScheduleTable (datas por UC), ClassCalendarView (visões dia/semana/mês/semestre/ano, colorido por professor; prática = borda tracejada)
  components/shared/      # BackupControls (export/import JSON), AppMaintenanceControls (limpar dados + forçar atualização), ConflictWarning (professor/sala), CapacityWarning (capacidade excedida), ThemeToggle (claro/escuro/sistema)
  views/               # DashboardView, CoursesView, ClassGroupsView, TeachersView, HolidaysView, RoomsView
  router/index.ts
tests/unit/*.spec.ts       # testes dos services/ (ver seção "Regra de testes" abaixo)
docs/MANUAL-DO-USUARIO.md    # manual em PT-BR para a cliente (não-técnica) — fonte "narrativa"; ver também src/content/userManual.ts (fonte estruturada usada no PDF)
public/senac-logo.png      # logo oficial do SENAC (fundo transparente), usada como favicon do site e na capa do manual em PDF
.github/workflows/deploy.yml   # build + testes + deploy automático no GitHub Pages a cada push em main
```

## Identidade institucional (créditos e logo)

O projeto é de uso interno do **SENAC-PB — CEP Cajazeiras**, desenvolvido por Gervásio Teixeira
(gervasio.eufrazino@pb.senac.br), colaborador do SENAC-PB. Esses dados ficam centralizados em
`INSTITUTIONAL_CREDITS` (`src/services/pdfGenerator.ts`) e são reutilizados tanto no rodapé fixo
da aplicação (`App.vue`) quanto no rodapé de todas as páginas de todo PDF gerado pelo sistema
(`applyFooterToAllPages`). **Não duplique esses textos em outro lugar** — sempre importe a
constante.

A logo oficial do SENAC (`public/senac-logo.png`, fundo transparente) é usada como favicon do
site e na capa do PDF do manual do usuário (`generateUserManualPdf`), via `INSTITUTIONAL_LOGO_PATH`.
Se o arquivo for removido, a geração do PDF não quebra — cai automaticamente em um espaço
reservado com o texto "Logo SENAC" no lugar da imagem (`tryLoadImageAsDataUrl` retorna `null`
silenciosamente em qualquer falha de carregamento).

### Paleta de cores institucionais

`src/constants/brand.ts` define `BRAND_COLORS` com os valores extraídos **diretamente dos pixels**
de `public/senac-logo.png` (decodificação de PNG feita manualmente, não estimativa visual):
azul `#0050a0` (`blue`) e laranja `#f89020` (`orange`), com variantes `blueDark`/`blueHover` para
hover e tema escuro. Os mesmos valores estão registrados em `src/style.css` via `@theme` do
Tailwind v4 (`--color-brand-blue`, etc.), mas a maioria dos componentes hoje usa o hex literal
diretamente em classes arbitrárias (`bg-[#0050a0]`) em vez do utilitário `bg-brand-blue` — ambos
funcionam, mas prefira `bg-brand-blue`/`border-brand-orange` em código novo, por consistência.

**Uso é deliberadamente sutil** (pedido explícito do usuário: "nada muito carregado, apenas para
reconhecimento"): o azul substitui `bg-slate-900`/`hover:bg-slate-700` apenas em elementos de
AÇÃO PRIMÁRIA (botões "Salvar", "+ Novo X", item de menu ativo, checkbox de dia da semana
selecionado) — nunca em fundos de página ou blocos grandes. O laranja aparece só como uma borda
de 2px no topo da sidebar (`App.vue`, `border-t-2 border-t-[#f89020]`) — nunca como fundo de
texto, porque o contraste de `#f89020` sobre branco é insuficiente para leitura (2.33:1, abaixo do
mínimo WCAG AA de 4.5:1). O azul `#0050a0` sobre branco passa com folga (7.91:1, quase AAA).

## Tema claro/escuro/sistema

`src/composables/useTheme.ts` gerencia a preferência de tema (`"light" | "dark" | "system"`),
persistida no localStorage (chave `horarios-senac:theme`) e aplicada como classe `.dark` no
`<html>`. **Chamado uma vez em `main.ts` antes de montar a árvore Vue**, para aplicar a classe
correta antes da primeira renderização e evitar flash de tema errado — não remova essa chamada
nem a mova para depois do `mount()`.

`src/style.css` declara `@custom-variant dark (&:where(.dark, .dark *));`, que faz a variante
`dark:` do Tailwind v4 reagir à classe `.dark` (não apenas a `prefers-color-scheme`, que é o
padrão do Tailwind). Quando a preferência é `"system"`, o composable escuta
`matchMedia("(prefers-color-scheme: dark)")` e reage a mudanças em tempo real.

`src/components/shared/ThemeToggle.vue` é o seletor de tema (três botões com símbolos ☀/☾/⚙ e
`aria-label`/`title` descritivos), fixo na sidebar. **Todo componente novo com cor de fundo/texto/
borda estática deve incluir o par `dark:` correspondente** — o padrão de mapeamento usado em todo
o projeto (`bg-white` → `dark:bg-slate-800`, `text-slate-800` → `dark:text-slate-100`,
`border-slate-200` → `dark:border-slate-700`, badges de status → `dark:bg-{cor}-900/40
dark:text-{cor}-300`, etc.) está documentado no histórico de commits e pode ser inferido de
qualquer view existente (ex: `TeachersView.vue`). Cores dinâmicas via `:style` (cor do professor
no calendário) não precisam de `dark:` — já funcionam em ambos os temas.

## Modelo de dados (resumo — ver `src/types/index.ts` para os tipos completos)

- **Teacher**: professor — nome, contato opcional, `colorHex` (cor usada no calendário), ativo.
- **Course**: curso — é um *template* (nome, carga horária total, ementa). Pode ter várias Turmas.
  Opcionalmente tem `units` (**Unidades Curriculares**: `{ id, name, workloadHours, kind: "theory" | "practice" }`,
  em ordem de execução); com UCs, `totalWorkloadHours` é sempre a soma delas (o `CourseForm` mantém
  em sincronia). `isApprenticeship` marca **Aprendizagem Profissional** (exige UC de teoria E de prática).
- **Room**: espaço físico (sala/laboratório/auditório) — nome, localização opcional, `capacity`
  (capacidade máxima de alunos), ativo.
- **ClassGroup** (turma): é a *instância* real — curso, professor, `roomId` opcional, `expectedStudents`
  opcional, data de início, carga horária diária, dias da semana, faixa de horário. Guarda os
  campos calculados: `computedEndDate`, `computedMonthlyBreakdown`, `computedClassDates`
  (recalculados pelo `calendarEngine` sempre que a turma é salva). `roomId`/`expectedStudents` são
  opcionais para não invalidar turmas cadastradas antes desses campos existirem. Também:
  `originalEndDate` (previsão de encerramento de referência, base do "adiada em N dias"),
  `practiceDailyHours` e `computedPracticeDates` (só em turmas de Aprendizagem; nelas `weekdays` são os
  dias de TEORIA e `computedClassDates` traz só as datas de teoria).
- **Holiday**: feriado — nacional (gerado automaticamente) ou customizado (estadual/municipal/
  ponto facultativo, cadastrado manualmente pela cliente). `scope: "recess"` é um **recesso escolar**:
  período (`date` a `endDate`), não é dia de folga geral e só afeta Aprendizagem.

## Onde vive cada regra de negócio

| Regra | Arquivo |
|---|---|
| Cálculo de data de término e distribuição mensal, pulando domingos/dias não letivos/feriados | `src/services/calendarEngine.ts` (`calculateSchedule`) |
| Feriados nacionais fixos e móveis (Páscoa, Carnaval, Corpus Christi) | `src/services/holidayEngine.ts` |
| Faixas de horário estritas permitidas (manhã/tarde/noite) | `src/constants/schedule.ts` (`ALLOWED_TIME_SLOTS`) — o formulário deve sempre usar essa lista, nunca aceitar horário livre |
| Formatação de data para exibição (pt-BR, dd/mm/aaaa) | `src/constants/format.ts` (`formatDateBr`) — datas de negócio são sempre string ISO "YYYY-MM-DD" internamente; **nunca renderize a string ISO crua na UI**, sempre passe por `formatDateBr` antes de exibir. Usado em `ClassGroupsView`, `DashboardView`, `HolidaysView`, `ClassGroupForm` (preview de término), `ConflictWarning`, `RescheduleActionModal`, `RescheduleConfirmModal`. `pdfGenerator.ts` tem sua própria `formatDateBr` interna (com fallback `"—"` para `null`) — mantida separada por ser específica da geração de PDF |
| Bloqueio de choque de horário (mesmo professor OU mesmo espaço) | `src/services/conflictChecker.ts` (`findScheduleConflict`) — checa professor primeiro, depois espaço; retorna `ScheduleConflict.kind: "teacher" \| "room"`. Chamado dentro de `classGroups.ts` store no `save()`, que bloqueia e retorna o conflito em vez de salvar. `ConflictWarning.vue` exibe mensagem diferente conforme `kind` |
| Bloqueio por capacidade de alunos excedida | `src/services/conflictChecker.ts` (`findCapacityConflict`) — compara `ClassGroup.expectedStudents` com `Room.capacity`; só roda se ambos os dois estiverem preenchidos. `classGroups.ts` store retorna `SaveClassGroupResult.capacityConflict` (independente de `conflict`); `CapacityWarning.vue` exibe a mensagem |
| **Aprendizagem Profissional** (teoria + prática em paralelo) | `src/services/apprenticeshipEngine.ts` (`calculateApprenticeshipSchedule`), escolhido por `classGroups.computeSchedule` quando `Course.isApprenticeship` + UCs de teoria e prática + `practiceDailyHours`. Regra confirmada pelo cliente: **(1)** os 10 primeiros dias úteis (seg-sex, sem feriados) são só de teoria em sequência (40h = 10% das 400h teóricas); **(2)** depois "volta ao normal": dias da semana da turma (`weekdays`) = teoria, demais dias úteis seg-sex = prática (na empresa); **(3)** em **recesso** não há teoria e a semana toda vira prática; **(4)** acabou a teoria → semana toda vira prática, e o inverso (acabou a prática → semana toda vira teoria, exceto em recesso); domingo/feriado nunca têm atividade, sábado só se for dia de teoria. Termina quando teoria E prática cumpridas. Horas contadas em centésimos (sem erro de float). **Prática não ocupa professor nem sala** — `conflictChecker` compara por datas reais (`classDates`) sempre que uma das turmas é de Aprendizagem; entre turmas comuns continua vigência+dias da semana. Recesso: `Holiday.scope === "recess"`, exposto por `holidays` store (`recesses`/`recessRanges`, fora de `customHolidays`); cursos comuns o ignoram. **Premissas a confirmar com a escola:** carga diária da prática = **6h por padrão** (campo editável na turma; a teoria usa a carga diária normal, 4h); os dias de prática são derivados (seg-sex menos os dias de teoria), não escolhidos à parte |
| UCs do curso: cadastro, importação do .docx e datas por UC | `CourseForm.vue` (editor com ↑/↓/✕, tipo Teoria/Prática, checkbox Aprendizagem) + `src/services/unitsDocxParser.ts` (`parseUnitsFromDocx`: lê `word/document.xml`, tabela "UC \| UNIDADE CURRICULAR \| CH" + linha "Carga Horária Total", aceita `1.162`/`20,5`; UC "Prática Profissional Supervisionada" vira `practice` pelo nome, o resto `theory`; avisa se o total declarado ≠ soma). Datas de cada UC: `src/services/unitSchedule.ts` (`computeClassGroupUnitSchedule` — UCs em sequência sobre as aulas; em Aprendizagem, teoria sobre as datas de teoria e prática sobre as de prática; uma data pode fechar uma UC e abrir a próxima se a CH não for múltipla da carga diária), exibidas por `UnitScheduleTable.vue` no preview da turma, na lista de turmas ("Ver UCs") e no PDF. Mudar as UCs do curso **não** recalcula turmas já salvas (mesmo comportamento da carga total) |
| Previsão de encerramento e atraso por adiamento | `ClassGroup.originalEndDate` = `computedEndDate` no momento do último `save()`/`reschedule()` (formulário ou mover turma inteira **redefinem** a referência); `postpone()` **preserva** (e preenche em turmas antigas sem o campo). `src/services/endDateForecast.ts` (`endDateDelayDays`) dá o atraso; `ClassGroupsView` mostra "Encerramento previsto" + selo "Adiada em N dia(s) · original dd/mm/aaaa"; `pdfGenerator` também |
| Cor do professor refletida no calendário | `Teacher.colorHex`, consumido em `ClassCalendarView.vue` via `:style` (Tailwind não gera classes para hex arbitrário em runtime) |
| Reagendar turma pelo calendário (dois modos, tocar/clicar — não arrastar) | Tocar/clicar numa aula (visões Semana/Mês de `ClassCalendarView.vue`) abre `RescheduleActionModal.vue`, que pede o modo + a nova data (`<input type="date">`). **Interação por toque-e-escolha, não drag-and-drop** — a API HTML5 Drag and Drop não funciona em touchscreens, então a mesma interação (clique/toque + seletor de data) serve desktop e mobile. Ambos os modos bloqueiam e revertem (sem salvar) se o novo posicionamento gerar conflito de professor/espaço ou capacidade excedida — `RescheduleConflictModal.vue` reaproveita `ConflictWarning`/`CapacityWarning` para exibir o motivo. **(1) Mover a turma inteira**: `src/services/rescheduler.ts` (`computeRescheduleDraft`) + `classGroups.ts` store (`reschedule`) deslocam a `startDate` inteira pelo delta de dias e recalculam tudo (aulas passadas e futuras se movem juntas). Se antecipa o início em relação à `startDate` atual, nada é salvo até `RescheduleConfirmModal.vue` confirmar (`reschedule(..., confirmAdvance: true)`). **(2) Adiar só a partir desta aula** (ex: "professor faltou uma semana"): `ClassGroup.postponements` (`ClassPostponement[]`, `types/index.ts`) guarda `{ fromDate, shiftDays }`; `calendarEngine.calculateSchedule` aplica esses ajustes durante a geração (ao cruzar `fromDate`, soma `shiftDays` ao cursor e continua procurando o próximo dia letivo válido) — aulas anteriores a `fromDate` nunca mudam, `startDate` da turma não muda, e a carga horária total é preservada (só empurra o fim). `src/services/rescheduler.ts` (`computePostponeDraft`) só aceita deslocar para frente; `classGroups.ts` store (`postpone`) acumula o ajuste em `existing.postponements` e roda a mesma checagem de conflito/capacidade antes de salvar. **Editar a turma pelo formulário (`ClassGroupForm.vue`/`save()`) ou mover a turma inteira sempre descartam `postponements` anteriores** — uma âncora antiga fica órfã/sem sentido se o cronograma-base mudar. Todos os modais de reagendamento usam `max-h-[90vh] overflow-y-auto` no wrapper para caber em telas pequenas mesmo com o teclado virtual aberto |
| Tooltip de aula no calendário (hover/toque-e-segurar) | `eventTooltip()` em `ClassCalendarView.vue` monta o `title` nativo do evento com nome da turma, curso, professor e espaço (um por linha, via `\n`) — usado nas visões Semana e Mês. A visão Dia mostra os mesmos dados sempre visíveis (sem depender de hover) |
| Visões de calendário (dia/semana/mês/semestre/ano) | `ClassCalendarView.vue` — um único componente com `viewMode` local; semestre/ano mostram mini-meses clicáveis que abrem a visão de mês |
| Limpar todos os dados salvos / forçar atualização do app | `src/components/shared/AppMaintenanceControls.vue`, fixo na sidebar (`App.vue`). "Limpar dados" exige dupla confirmação e usa `clearAllLocalStorage` de `useLocalStorage.ts`. "Buscar atualizações" limpa Cache API/Service Worker (se existirem) e recarrega com um query param de cache-busting — não apaga dados |
| Manual do usuário para download público em PDF | Botão "Baixar manual (PDF)" fixo na sidebar (`App.vue`) → `generateUserManualPdf` em `src/services/pdfGenerator.ts`, que lê o conteúdo de `src/content/userManual.ts`. Não depende de nenhum dado cadastrado — funciona mesmo com o sistema "vazio" |

## Responsividade mobile

Breakpoint de referência: `lg` (Tailwind, 1024px). Abaixo dele, a sidebar (`App.vue`) vira um
drawer off-canvas: fica `fixed` fora da tela (`-translate-x-full`), abre com um botão hambúrguer
numa barra superior própria do mobile (`header ... lg:hidden`), com overlay escurecido atrás
(`z-30`, abaixo do drawer `z-40`) que fecha ao tocar fora. Um `watch` na rota fecha o drawer
automaticamente ao navegar. A partir de `lg`, o drawer volta a ser `static` e sempre visível
(comportamento de sidebar fixa tradicional) — não altere essa parte sem testar os dois modos.

Tabelas (Turmas/Cursos/Professores/Feriados) usam `overflow-x-auto` + `min-w-[...]px` no
container para rolar horizontalmente em telas estreitas em vez de espremer colunas — mantenha
esse padrão em qualquer tabela nova. O calendário (`ClassCalendarView.vue`) segue o mesmo padrão
nas visões Semana e Mês (grid de 7 colunas com `min-w-[560px]` dentro de um `overflow-x-auto`).

**Toda a plataforma é operável só por toque** — nenhuma ação depende de hover (não há
`group-hover`/`@mouseenter` disparando comportamento essencial em lugar nenhum do projeto) e o
calendário evita a API HTML5 Drag and Drop (que não responde a toque) em favor de tocar/clicar
numa aula para abrir um modal de ação (ver "Reagendar turma pelo calendário" na tabela de regras
de negócio acima). Modais com conteúdo variável usam `max-h-[90vh] overflow-y-auto` no wrapper
para não cortar conteúdo em telas pequenas com o teclado virtual aberto — siga esse padrão em
qualquer modal novo.

## Regra de testes (evitar regressão)

**Toda nova funcionalidade ou alteração que tocar algo em `src/services/` deve vir acompanhada de
teste(s) em `tests/unit/` cobrindo o caso novo, e `npm run test` deve passar antes de considerar a
tarefa concluída.** Esse é o núcleo mais sensível a bugs sutis (datas, feriados móveis, sobreposição
de horários) — cobertura de teste aqui é obrigatória, não opcional.

Casos já cobertos (não remover sem substituir por algo equivalente):
- `calendarEngine.spec.ts`: caso simples, feriado no meio, virada de mês/ano, proteção contra domingo/weekdays vazio, postponements (desloca a partir de fromDate mantendo aulas anteriores intactas, respeita dias da semana, múltiplos ajustes em cascata aplicados em ordem cronológica independente da ordem de entrada).
- `holidayEngine.spec.ts`: Páscoa em anos conhecidos, feriados fixos, feriados móveis derivados, merge com customizados.
- `conflictChecker.spec.ts`: sobreposição de horário/dia, sem sobreposição de dia, horários adjacentes sem overlap, vigências não cruzadas, professores diferentes, turmas canceladas ignoradas, edição da própria turma, conflito de sala entre professores diferentes, sem conflito de sala quando os espaços diferem, sem conflito quando nenhuma turma tem espaço definido, prioridade professor > sala quando ambos colidem, capacidade excedida/igual/menor/sem espaço/sem nº de alunos.
- `backup.spec.ts`: export contém todas as entidades (incluindo rooms), roundtrip export→import, rejeição de JSON malformado/incompleto/versão futura, aceitação de backup legado sem a chave "rooms" (preenche com lista vazia).
- `apprenticeshipEngine.spec.ts`: 10 dias iniciais só de teoria, qui/sex teoria + seg-qua prática, cargas cumpridas exatamente, o inverso (prática acaba → semana toda teoria), teoria acaba → semana toda prática, os exemplos do cliente (dia 11 numa quarta = prática / numa sexta = teoria / início na quinta → quinta é prática), feriado nos 10 dias e na prática, recesso (com e sem prática restante), sábado só como teoria, domingo nunca, distribuição mensal teoria/prática, adiamento, ponto flutuante, parâmetros inválidos.
- `unitSchedule.spec.ts`, `unitsDocxParser.spec.ts`, `endDateForecast.spec.ts`, `pdfGenerator.spec.ts` (PDF da turma: encerramento/atraso, UCs, Aprendizagem), `classGroupsStore.spec.ts` (baseline `originalEndDate` em criar/editar/adiar/mover; Aprendizagem com recesso e conflito de teoria vs. prática; recessos no `holidays` store).
- `conflictChecker.spec.ts` (bloco extra): comparação por datas reais com Aprendizagem — teoria conflita mesmo fora dos dias da semana da turma, prática não conflita, horários sem sobreposição, e turmas comuns mantêm o comportamento anterior.
- `rescheduler.spec.ts`: diferença de dias entre datas (positiva/negativa/zero/virada de mês), deslocamento de data ISO para frente/trás, adiar turma inteira (sem confirmação), arrastar aula do meio da turma (desloca a startDate pelo mesmo delta), antecipar para antes do início definido (exige confirmação), soltar no mesmo dia (delta zero), computePostponeDraft (shiftDays calculado ao adiar, rejeição de soltar na mesma data ou em data anterior).

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

**MVP completo e funcional**, com módulo de espaços físicos, identidade visual institucional
sutil, tema claro/escuro/sistema e reagendamento de turma por arrastar-e-soltar no calendário
(turma inteira ou adiamento pontual a partir de uma aula) (23/08/2026). Todas as telas, serviços
e testes descritos neste documento existem e passam:

- `npx vue-tsc -b --noEmit` — sem erros de tipo
- `npx vitest run` — 118 testes, 11 arquivos, todos passando
- `npm run build` — build de produção OK

Implementado:
- `src/types/index.ts` (inclui `Room`, `ClassPostponement`), `src/constants/schedule.ts`
- `src/services/{calendarEngine,holidayEngine,conflictChecker,backup,pdfGenerator,rescheduler,apprenticeshipEngine,endDateForecast,unitSchedule,unitsDocxParser}.ts` + testes de todos
- **Retorno da validação inicial (21/09/2026)**: previsão de encerramento com comparativo/atraso, Unidades Curriculares (cadastro + importação do .docx do outro sistema + datas por UC) e regra de Aprendizagem Profissional (teoria/prática em paralelo, recesso) — ver linhas correspondentes na tabela de regras
- `src/stores/{teachers,courses,holidays,classGroups,rooms}.ts` (Pinia, persistência automática em localStorage; `classGroups.reschedule`/`postpone` cobrem os dois modos de drag-and-drop)
- `src/composables/useLocalStorage.ts`
- `src/components/forms/{TeacherForm,CourseForm,HolidayForm,ClassGroupForm,RoomForm}.vue`
- `src/components/calendar/{MonthlyBreakdown,UnitScheduleTable,ClassCalendarView}.vue` (Semana/Mês suportam arrastar uma aula; modal pergunta se move a turma inteira ou adia só a partir dali)
- `src/components/shared/{ConflictWarning,CapacityWarning,BackupControls,AppMaintenanceControls,RescheduleActionModal,RescheduleConfirmModal,RescheduleConflictModal}.vue`
- `src/views/{DashboardView,CoursesView,ClassGroupsView,TeachersView,HolidaysView,RoomsView}.vue`
- Botões de "Baixar PDF" funcionais em Turmas (PDF da turma, com espaço/capacidade quando preenchidos) e Professores (PDF do professor)
- Bloqueio de conflito de sala e de capacidade excedida integrados ao fluxo de salvar turma
- `BackupControls.vue` e `AppMaintenanceControls.vue` fixos na sidebar (`App.vue`), disponíveis em qualquer tela
- Manual do usuário para download em PDF (`generateUserManualPdf`), com logo institucional na capa
- Sidebar responsiva (drawer off-canvas em mobile/tablet)
- `.github/workflows/deploy.yml` (build + test + deploy no push em `main`)
- `docs/MANUAL-DO-USUARIO.md` + `src/content/userManual.ts`
- Cores institucionais do SENAC (`src/constants/brand.ts`) aplicadas de forma sutil (botões de ação primária, item de menu ativo, borda de acento) em todas as views/formulários
- Tema claro/escuro/sistema (`useTheme.ts` + `ThemeToggle.vue`), com `dark:` aplicado em todos os 18 componentes/views do projeto

**A confirmar com a escola / cliente** (implementado com uma premissa, fácil de ajustar):
- Carga diária de **prática** de 6h como padrão na turma de Aprendizagem (`DEFAULT_PRACTICE_DAILY_HOURS` em `ClassGroupForm.vue`; é um campo editável). A teoria usa a carga diária normal (4h no exemplo dado: 10 dias = 40h).
- Dias de prática = seg-sex menos os dias de teoria da turma (derivados). Se a escola quiser escolher os dias de prática à parte, isso muda `apprenticeshipEngine` e o formulário.
- Recesso hoje é cadastrado em Feriados (`scope: "recess"`, período) e vale para todas as turmas de Aprendizagem; não há recesso por turma.
- Os 10 dias iniciais contam só seg-sex (sábado não conta), com base no exemplo do cliente (começando numa quinta, terminam na quarta).

**Pendente / próximos passos possíveis** (não implementado ainda, não assumir que existe):
- Professor por UC (hoje é um professor por turma) — foi avaliado e deixado de fora de propósito; mudaria bastante a checagem de conflito
- Importar UCs de CSV/planilha (só .docx hoje)
- Testes de componente (`@vue/test-utils`) — hoje a suite cobre só `services/`, que é o núcleo crítico
- Edição/exclusão de status da turma (`ongoing`/`finished`) não tem UI dedicada além do campo cru
- PDF dedicado "por espaço" (agenda de uma sala) não existe ainda — só há PDF por turma e por professor

Em caso de dúvida sobre o que está funcional, rode `npm run test` e `npm run build`.
