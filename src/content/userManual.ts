/**
 * Conteúdo do manual do usuário, em formato estruturado.
 *
 * Fonte de verdade única para o PDF gerado por `services/pdfGenerator.ts`
 * (`generateUserManualPdf`). O texto "narrativo" completo, com mais
 * contexto e formatação Markdown, vive em `docs/MANUAL-DO-USUARIO.md` —
 * ao atualizar um, revise o outro para não ficarem dessincronizados.
 */

export interface ManualBlock {
  /** Parágrafo de texto corrido. */
  type: "paragraph"
  text: string
}

export interface ManualList {
  /** Lista numerada (passo a passo) ou com marcadores. */
  type: "list"
  ordered: boolean
  items: string[]
}

export type ManualContentBlock = ManualBlock | ManualList

export interface ManualSection {
  heading: string
  blocks: ManualContentBlock[]
}

function p(text: string): ManualBlock {
  return { type: "paragraph", text }
}

function ol(items: string[]): ManualList {
  return { type: "list", ordered: true, items }
}

function ul(items: string[]): ManualList {
  return { type: "list", ordered: false, items }
}

export const USER_MANUAL_TITLE = "Manual do Usuário — Horários Senac"

export const USER_MANUAL_SECTIONS: ManualSection[] = [
  {
    heading: "O que é o sistema",
    blocks: [
      p(
        "O Horários Senac é uma ferramenta interna para organizar a formação de turmas: cadastrar " +
          "professores, cursos e feriados, montar turmas com dias e horários fixos, e deixar o sistema " +
          "calcular automaticamente a data em que cada turma termina e quantas aulas/horas acontecem em cada mês.",
      ),
      p("Professores não acessam este sistema — ele é de uso exclusivo de quem organiza as turmas."),
      p(
        "Importante: os dados ficam salvos apenas no navegador deste computador (veja a seção " +
          "\"Backup: por que é tão importante\" mais adiante).",
      ),
    ],
  },
  {
    heading: "1. Cadastrar um professor",
    blocks: [
      ol([
        "No menu lateral, clique em Professores.",
        "Clique em Novo professor.",
        "Preencha o nome (obrigatório), e-mail e telefone (opcionais).",
        "Escolha uma cor para o professor — essa cor vai identificar as turmas dele no calendário, então prefira cores bem diferentes entre professores diferentes.",
        "Clique em Salvar.",
      ]),
      p("Para editar ou desativar um professor, use os botões na lista de professores."),
    ],
  },
  {
    heading: "2. Cadastrar feriados",
    blocks: [
      p(
        "O sistema já vem com os feriados nacionais de alguns anos pré-carregados automaticamente " +
          "(Ano Novo, Tiradentes, Dia do Trabalho, Independência, Nossa Senhora Aparecida, Finados, " +
          "Proclamação da República, Natal, além de Páscoa, Carnaval, Sexta-feira Santa e Corpus Christi, " +
          "que mudam de data todo ano). Você não precisa cadastrar esses.",
      ),
      p("Se precisar de mais anos à frente, a tela de Feriados tem um botão para gerar os feriados nacionais de um ano específico."),
      p("Para feriados estaduais, municipais ou pontos facultativos (que variam por cidade/estado):"),
      ol(["Vá em Feriados.", "Clique em Novo feriado.", "Preencha a data, o nome e o tipo (estadual/municipal/outro).", "Clique em Salvar."]),
    ],
  },
  {
    heading: "3. Cadastrar um curso",
    blocks: [
      ol([
        "Vá em Cursos.",
        "Clique em Novo curso.",
        "Preencha o nome, uma descrição (opcional) e a carga horária total em horas (ex: 160).",
        "Clique em Salvar.",
      ]),
      p(
        "Um curso é como um \"modelo\": o mesmo curso pode dar origem a várias turmas diferentes ao longo " +
          "do tempo (ex: \"Excel Básico\" pode ter uma turma em janeiro de manhã e outra em março à noite).",
      ),
    ],
  },
  {
    heading: "4. Criar uma turma",
    blocks: [
      ol([
        "Vá em Turmas e clique em Nova turma.",
        "Escolha o curso e o professor responsável.",
        "Dê um nome para a turma (ex: \"Excel Básico — Turma Manhã Jan/2026\").",
        "Escolha a data de início.",
        "Informe a carga horária diária (ex: 4h).",
        "Marque os dias da semana em que a turma terá aula (segunda a sábado).",
        "Escolha o horário entre as opções fixas disponíveis (manhã, tarde ou noite).",
        "Confira a data de término e a distribuição mensal calculadas automaticamente.",
        "Clique em Salvar.",
      ]),
      p(
        "Se o professor escolhido já tiver outra turma no mesmo dia da semana e horário, dentro do mesmo " +
          "período, o sistema vai impedir salvar e mostrar qual é a turma conflitante.",
      ),
    ],
  },
  {
    heading: "5. Ver o calendário",
    blocks: [
      p(
        "A tela de Turmas mostra um calendário com todas as aulas, cada uma destacada com a cor do " +
          "professor responsável. É possível alternar entre as visões de Dia, Semana, Mês, Semestre e Ano.",
      ),
    ],
  },
  {
    heading: "6. Gerar PDF",
    blocks: [
      ul([
        "PDF da turma: na lista de turmas, clique em Baixar PDF ao lado da turma desejada — traz os dados da turma, o calendário completo de aulas e o resumo de horas por mês.",
        "PDF do professor: na lista de professores, clique em Baixar PDF ao lado do nome — traz os dados do professor e a agenda consolidada de todas as turmas dele.",
      ]),
    ],
  },
  {
    heading: "Backup: por que é tão importante",
    blocks: [
      p(
        "Os dados cadastrados ficam salvos apenas no navegador deste computador — não existe um " +
          "servidor guardando essas informações. Se você limpar o histórico/cache do navegador sem ter " +
          "feito backup, os dados são perdidos. Se você abrir o sistema em outro computador ou navegador, " +
          "ele começa vazio.",
      ),
      p("Fazer backup (download): use o botão Baixar backup no menu lateral. Um arquivo .json será baixado — guarde-o em local seguro."),
      p(
        "Restaurar um backup (upload): use o botão Importar backup e selecione o arquivo .json. Atenção: " +
          "isso substitui os dados atuais do navegador pelos dados do arquivo importado.",
      ),
      p("Recomendamos fazer backup sempre que cadastrar uma turma nova ou fizer mudanças importantes."),
    ],
  },
  {
    heading: "Manutenção do sistema",
    blocks: [
      p(
        "Buscar atualizações: se uma nova funcionalidade foi publicada e não está aparecendo, use o " +
          "botão Buscar atualizações no menu lateral — ele força o navegador a buscar a versão mais " +
          "recente do sistema, sem apagar nenhum dado.",
      ),
      p(
        "Limpar todos os dados: apaga permanentemente todos os professores, cursos, turmas e feriados " +
          "cadastrados neste navegador. Use apenas se tiver certeza (e de preferência com um backup feito " +
          "antes) — a ação pede confirmação em dobro por ser irreversível.",
      ),
    ],
  },
  {
    heading: "Dúvidas frequentes",
    blocks: [
      p("Posso usar o sistema em mais de um computador ao mesmo tempo? Sim, mas os dados não se sincronizam automaticamente — use o backup para levar os dados de um para o outro."),
      p("Perdi o arquivo de backup, e agora? Se os dados ainda estiverem no navegador, continue usando e faça um novo backup. Sem backup e sem dados no navegador, não é possível recuperá-los."),
      p("O sistema funciona sem internet? Depois de carregar pela primeira vez, o uso do dia a dia funciona offline, já que os dados ficam no navegador."),
    ],
  },
]
