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
      p(
        "Recesso escolar: para um período em que não há teoria (ex: recesso de julho ou de fim de ano), " +
          "escolha o tipo \"Recesso escolar (período)\" e informe o primeiro e o último dia. O recesso só afeta " +
          "cursos de Aprendizagem: durante o período, a semana toda (segunda a sexta) vira prática. Cursos comuns o ignoram.",
      ),
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
      p(
        "Unidades Curriculares (UCs): se o curso é dividido em UCs, cadastre-as no próprio formulário do curso. " +
          "Clique em Adicionar UC (nome, carga horária e tipo Teoria ou Prática) ou em Importar do Word (.docx) " +
          "para carregar a lista de UCs de um documento com a tabela \"UC / Unidade Curricular / CH\". " +
          "Use as setas para ordenar as UCs. Com UCs cadastradas, a carga horária total do curso passa a ser " +
          "a soma delas, e cada turma mostra a data de início e de término de cada UC.",
      ),
      p(
        "Curso de Aprendizagem Profissional: marque essa opção quando o curso tiver teoria (no SENAC) e prática " +
          "(na empresa) correndo em paralelo. É preciso ter pelo menos uma UC de Teoria e uma de Prática. " +
          "Ao importar o documento de uma Aprendizagem, o sistema já marca essa opção.",
      ),
    ],
  },
  {
    heading: "4. Cadastrar um espaço (sala, laboratório, etc.)",
    blocks: [
      ol([
        "Vá em Espaços.",
        "Clique em Novo espaço.",
        "Preencha o nome, a localização (opcional) e a capacidade (quantidade máxima de alunos).",
        "Clique em Salvar.",
      ]),
      p(
        "Cadastrar os espaços permite ao sistema avisar quando duas turmas forem marcadas para a mesma " +
          "sala no mesmo horário, e avisar quando uma turma tiver mais alunos do que o espaço comporta.",
      ),
    ],
  },
  {
    heading: "5. Criar uma turma",
    blocks: [
      ol([
        "Vá em Turmas e clique em Nova turma.",
        "Escolha o curso e o professor responsável.",
        "Se desejar, escolha o espaço e informe o número de alunos previstos (opcionais).",
        "Dê um nome para a turma (ex: \"Excel Básico — Turma Manhã Jan/2026\").",
        "Escolha a data de início.",
        "Informe a carga horária diária (ex: 4h).",
        "Marque os dias da semana em que a turma terá aula (segunda a sábado).",
        "Escolha o horário entre as opções fixas disponíveis (manhã, tarde ou noite).",
        "Confira a previsão de encerramento e a distribuição mensal calculadas automaticamente (e, se o curso tem UCs, as datas de cada UC).",
        "Clique em Salvar.",
      ]),
      p(
        "Previsão de encerramento: a data aparece na lista de turmas. Se uma aula for adiada pelo calendário " +
          "(por exemplo, o professor faltou), a previsão é recalculada e a lista mostra \"Adiada em N dia(s)\" " +
          "junto com a previsão original. Editar a turma pelo formulário ou mover a turma inteira define uma nova previsão de referência.",
      ),
      p(
        "Turmas de Aprendizagem: os dias da semana marcados são os dias de teoria (no SENAC), e os demais dias úteis " +
          "(segunda a sexta) são de prática (na empresa). Informe também a carga horária diária da prática. " +
          "A turma sempre começa com 10 dias úteis seguidos só de teoria; depois, os dias de teoria da turma são teoria e os " +
          "demais são prática. Em recesso, ou quando a carga da teoria termina, a semana toda vira prática; quando a prática " +
          "termina, a semana toda vira teoria. A prática acontece na empresa, então não gera conflito de professor nem de espaço.",
      ),
      p(
        "O sistema verifica dois tipos de conflito antes de salvar: mesmo professor em duas turmas no " +
          "mesmo horário, ou mesmo espaço ocupado por duas turmas no mesmo horário. Em qualquer um dos " +
          "casos, o sistema impede salvar e mostra qual é a turma conflitante.",
      ),
      p(
        "Se o número de alunos previstos for maior que a capacidade do espaço escolhido, o sistema " +
          "também impede salvar e mostra a capacidade máxima permitida.",
      ),
    ],
  },
  {
    heading: "6. Ver o calendário",
    blocks: [
      p(
        "A tela de Turmas mostra um calendário com todas as aulas, cada uma destacada com a cor do " +
          "professor responsável. É possível alternar entre as visões de Dia, Semana, Mês, Semestre e Ano. " +
          "Nas turmas de Aprendizagem, os dias de prática (na empresa) aparecem com borda tracejada.",
      ),
    ],
  },
  {
    heading: "7. Gerar PDF",
    blocks: [
      ul([
        "PDF da turma: na lista de turmas, clique em Baixar PDF ao lado da turma desejada — traz os dados da turma (incluindo espaço e alunos previstos, quando preenchidos), a previsão de encerramento (e o atraso, se houve adiamento), as datas de cada UC, o calendário completo de aulas e o resumo de horas por mês.",
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
        "Limpar todos os dados: apaga permanentemente todos os professores, cursos, turmas, espaços e " +
          "feriados cadastrados neste navegador. Use apenas se tiver certeza (e de preferência com um " +
          "backup feito antes) — a ação pede confirmação em dobro por ser irreversível.",
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
