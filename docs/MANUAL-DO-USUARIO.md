# Manual do Usuário — Horários Senac

Este manual explica como usar o sistema de organização de turmas no dia a dia.
Não é necessário conhecimento técnico para seguir os passos abaixo.

> Este manual também pode ser baixado em PDF, com a logo do SENAC na capa, diretamente pelo
> sistema: use o botão **"Baixar manual (PDF)"** na barra lateral, em qualquer tela. Não é
> necessário ter nenhum dado cadastrado para baixá-lo.

## O que é o sistema

O Horários Senac é uma ferramenta interna para organizar a formação de turmas: cadastrar
professores, cursos e feriados, montar turmas com dias e horários fixos, e deixar o sistema
calcular automaticamente a data em que cada turma termina e quantas aulas/horas acontecem em
cada mês.

Professores **não** acessam este sistema — ele é de uso exclusivo de quem organiza as turmas.

**Importante:** os dados ficam salvos apenas no navegador deste computador (veja a seção
["Backup: por que é tão importante"](#backup-por-que-é-tão-importante) mais abaixo).

## Como abrir o sistema

Acesse o endereço fornecido (um link do tipo `https://SEU-USUARIO.github.io/horarios-senac/`).
Recomendamos salvar esse endereço nos favoritos do navegador.

## 1. Cadastrar um professor

1. No menu lateral, clique em **Professores**.
2. Clique em **Novo professor**.
3. Preencha o nome (obrigatório), e-mail e telefone (opcionais).
4. Escolha uma **cor** para o professor — essa cor vai aparecer identificando as turmas dele
   no calendário, então prefira cores bem diferentes entre professores diferentes.
5. Clique em **Salvar**.

Para editar ou desativar um professor, use os botões na lista de professores.

## 2. Cadastrar feriados

O sistema já vem com os **feriados nacionais** de alguns anos pré-carregados automaticamente
(Ano Novo, Tiradentes, Dia do Trabalho, Independência, Nossa Senhora Aparecida, Finados,
Proclamação da República, Natal, além de Páscoa, Carnaval, Sexta-feira Santa e Corpus Christi,
que mudam de data todo ano). Você não precisa cadastrar esses — eles já entram automaticamente
no cálculo do calendário de qualquer turma.

Se precisar de mais anos à frente, a tela de **Feriados** tem um botão para gerar os feriados
nacionais de um ano específico.

Para feriados **estaduais, municipais ou pontos facultativos** (que variam por cidade/estado):

1. Vá em **Feriados**.
2. Clique em **Novo feriado**.
3. Preencha a data, o nome e o tipo (estadual/municipal/outro).
4. Clique em **Salvar**.

Esses feriados também passam a ser descontados automaticamente no cálculo de qualquer turma.

## 3. Cadastrar um curso

1. Vá em **Cursos**.
2. Clique em **Novo curso**.
3. Preencha o nome, uma descrição (opcional) e a **carga horária total** em horas (ex: 160).
4. Clique em **Salvar**.

Um curso é como um "modelo": o mesmo curso pode dar origem a várias turmas diferentes ao
longo do tempo (ex: "Excel Básico" pode ter uma turma em janeiro de manhã e outra em março à noite).

## 4. Criar uma turma

1. Vá em **Turmas**.
2. Clique em **Nova turma**.
3. Escolha o **curso** e o **professor** responsável.
4. Dê um nome para a turma (ex: "Excel Básico — Turma Manhã Jan/2026").
5. Escolha a **data de início**.
6. Informe a **carga horária diária** (quantas horas de aula por dia, ex: 4).
7. Marque os **dias da semana** em que a turma terá aula (segunda a sábado — domingo nunca
   é usado).
8. Escolha o **horário** em uma das opções fixas disponíveis (manhã, tarde ou noite). Só é
   possível escolher entre os horários já configurados no sistema, para manter a padronização.

Assim que os campos principais estiverem preenchidos, o sistema mostra automaticamente:

- A **data prevista de término** da turma.
- Uma tabela com **quantas aulas e quantas horas** acontecem em cada mês da turma.

Esse cálculo já leva em conta os feriados cadastrados e pula automaticamente os dias da semana
que não foram marcados.

9. Clique em **Salvar**.

### O que acontece se der conflito de horário

Se o professor escolhido já tiver outra turma no mesmo dia da semana e horário, dentro do
mesmo período, o sistema **vai impedir salvar** e vai mostrar qual é a turma conflitante,
para que você possa ajustar o horário, o dia ou trocar o professor.

## 5. Ver o calendário

A tela de **Turmas** mostra um calendário mensal com todas as aulas de todas as turmas, cada
uma destacada com a cor do professor responsável. Use as setas para navegar entre os meses.

## 6. Gerar PDF

Você pode baixar um PDF de duas formas:

- **PDF da turma**: na lista de turmas, clique em **Baixar PDF** ao lado da turma desejada.
  O PDF traz os dados da turma, o calendário completo de aulas (data e dia da semana) e um
  resumo de quantas horas ocorrem em cada mês.
- **PDF do professor**: na lista de professores, clique em **Baixar PDF** ao lado do nome.
  O PDF traz os dados do professor e a agenda consolidada de todas as turmas dele (útil para
  o professor conferir sua própria agenda, mesmo sem acessar o sistema).

## Backup: por que é tão importante

Os dados cadastrados (professores, cursos, turmas, feriados customizados) ficam salvos **apenas
no navegador deste computador** — não existe um servidor guardando essas informações. Isso
significa que:

- Se você limpar o histórico/cache do navegador sem ter feito backup, **os dados são perdidos**.
- Se você abrir o sistema em outro computador ou outro navegador, ele vai começar **vazio**.

Por isso, é essencial usar os botões de backup regularmente:

### Fazer backup (download)

1. Em qualquer tela, use o botão **Baixar backup**.
2. Um arquivo `.json` será baixado para o seu computador (normalmente na pasta Downloads).
3. Guarde esse arquivo em um local seguro (nuvem, pendrive, e-mail para você mesmo(a), etc.).

Recomendamos fazer esse backup **sempre que cadastrar uma turma nova ou fizer mudanças
importantes**.

### Restaurar um backup (upload)

1. Use o botão **Importar backup**.
2. Selecione o arquivo `.json` gerado anteriormente.
3. Confirme a importação — atenção: isso substitui os dados atuais do navegador pelos dados do
   arquivo importado.

Use essa opção ao trocar de computador, reinstalar o navegador, ou recuperar dados após um
problema.

## Dúvidas frequentes

**Posso usar o sistema em mais de um computador ao mesmo tempo?**
Sim, mas os dados não se sincronizam automaticamente entre eles. Use o backup para levar os
dados de um computador para o outro.

**Perdi o arquivo de backup, e agora?**
Se os dados ainda estiverem no navegador (você não limpou o histórico/cache), basta continuar
usando normalmente e fazer um novo backup. Se os dados foram perdidos e não há backup salvo,
infelizmente não é possível recuperá-los — por isso a recomendação é manter backups frequentes.

**O sistema funciona sem internet?**
Depois que a página carrega pela primeira vez, a maior parte do uso funciona offline, já que os
dados ficam no navegador. Porém é necessário internet para acessar o endereço do sistema pela
primeira vez (ou depois de limpar o cache).
