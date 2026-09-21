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

### Recesso escolar (período)

Para um período em que não há teoria (ex: recesso de julho ou de fim de ano), escolha o tipo
**Recesso escolar (período)** em **Novo feriado** e informe o **primeiro** e o **último** dia do
recesso. Diferente de um feriado, o recesso **só afeta cursos de Aprendizagem**: durante o
período não há teoria e a semana toda (segunda a sexta) vira prática. Cursos comuns ignoram
os recessos.

## 3. Cadastrar um curso

1. Vá em **Cursos**.
2. Clique em **Novo curso**.
3. Preencha o nome, uma descrição (opcional) e a **carga horária total** em horas (ex: 160).
4. Clique em **Salvar**.

Um curso é como um "modelo": o mesmo curso pode dar origem a várias turmas diferentes ao
longo do tempo (ex: "Excel Básico" pode ter uma turma em janeiro de manhã e outra em março à noite).

### Unidades Curriculares (UCs)

Se o curso é dividido em UCs, cadastre-as no próprio formulário do curso:

- **+ Adicionar UC**: informe o nome, a carga horária e o tipo (**Teoria** ou **Prática**).
- **Importar do Word (.docx)**: carrega a lista de UCs de um documento com a tabela
  "UC / Unidade Curricular / CH" (o mesmo formato gerado por outros sistemas). A UC
  "Prática Profissional Supervisionada" é marcada como Prática automaticamente; confira o tipo de
  cada UC na lista. Se a soma das UCs diferir do total declarado no documento, o sistema avisa.
- As setas **↑ ↓** reordenam as UCs (a ordem é a ordem de execução) e **✕** remove uma UC.

Com UCs cadastradas, a **carga horária total** do curso passa a ser a soma delas, e cada turma
mostra a **data de início e de término de cada UC**. Turmas já cadastradas não são recalculadas
automaticamente ao mudar as UCs do curso: abra a turma e salve novamente.

### Curso de Aprendizagem Profissional

Marque **Curso de Aprendizagem Profissional** quando o curso tiver **teoria** (no SENAC) e
**prática** (na empresa) correndo em paralelo. É preciso ter pelo menos uma UC de Teoria e uma de
Prática. Ao importar o documento de uma Aprendizagem, o sistema já marca essa opção.

## 4. Cadastrar um espaço (sala, laboratório, etc.)

1. Vá em **Espaços**.
2. Clique em **Novo espaço**.
3. Preencha o nome (ex: "Sala 3" ou "Laboratório de Informática 1"), a localização (opcional,
   ex: "Bloco A, 2º andar") e a **capacidade** (quantidade máxima de alunos que o espaço comporta).
4. Clique em **Salvar**.

Cadastrar os espaços é o que permite ao sistema avisar quando duas turmas forem marcadas para
a mesma sala no mesmo horário, e também avisar quando uma turma tiver mais alunos previstos do
que o espaço comporta.

## 5. Criar uma turma

1. Vá em **Turmas**.
2. Clique em **Nova turma**.
3. Escolha o **curso** e o **professor** responsável.
4. Se desejar, escolha o **espaço** onde a turma vai acontecer e informe o **número de alunos
   previstos** — esses dois campos são opcionais, mas se preenchidos juntos o sistema confere
   se a turma cabe no espaço escolhido.
5. Dê um nome para a turma (ex: "Excel Básico — Turma Manhã Jan/2026").
6. Escolha a **data de início**.
7. Informe a **carga horária diária** (quantas horas de aula por dia, ex: 4).
8. Marque os **dias da semana** em que a turma terá aula (segunda a sábado — domingo nunca
   é usado).
9. Escolha o **horário** em uma das opções fixas disponíveis (manhã, tarde ou noite). Só é
   possível escolher entre os horários já configurados no sistema, para manter a padronização.

Assim que os campos principais estiverem preenchidos, o sistema mostra automaticamente:

- A **previsão de encerramento** da turma.
- Uma tabela com **quantas aulas e quantas horas** acontecem em cada mês da turma.
- Se o curso tem UCs, a **data de início e de término de cada UC**.

Esse cálculo já leva em conta os feriados cadastrados e pula automaticamente os dias da semana
que não foram marcados.

10. Clique em **Salvar**.

### Previsão de encerramento e adiamentos

A previsão de encerramento aparece na lista de turmas. Se uma aula for **adiada pelo calendário**
(por exemplo, o professor faltou ou o ambiente ficou indisponível), a previsão é recalculada e a
lista passa a mostrar **"Adiada em N dia(s)"** junto com a **previsão original**. Editar a turma
pelo formulário ou mover a turma inteira define uma nova previsão de referência (o atraso volta
a zero).

### Turmas de Aprendizagem

Quando o curso é de Aprendizagem, a turma funciona assim:

- Os **dias da semana** marcados são os **dias de teoria** (no SENAC). Os demais dias úteis
  (segunda a sexta) são de **prática** (na empresa). Ex.: teoria na quinta e sexta, prática de
  segunda a quarta.
- Informe também a **carga horária diária da prática**, além da carga diária da teoria.
- A turma **sempre começa com 10 dias úteis seguidos só de teoria** (40h, que são 10% da carga
  teórica de 400h). A partir do 11º dia, "volta ao normal": cada dia é teoria ou prática conforme
  o dia da semana (se o 11º dia cair num dia de prática, é prática; se cair num dia de teoria,
  é teoria).
- Em **recesso** (cadastrado em Feriados), ou quando a **carga horária da teoria termina**, a
  semana toda (segunda a sexta) vira **prática**. No inverso, quando a **prática termina**, a
  semana toda vira **teoria**.
- A **prática acontece na empresa**: ela não ocupa professor nem espaço e não gera conflito de
  horário. Só os dias de teoria entram na checagem de conflitos.
- A turma termina quando **teoria e prática** estão cumpridas.

### O que acontece se der conflito de horário ou de espaço

O sistema verifica dois tipos de conflito antes de salvar uma turma:

- **Conflito de professor**: se o professor escolhido já tiver outra turma no mesmo dia da
  semana e horário, dentro do mesmo período.
- **Conflito de espaço**: se o espaço escolhido já estiver ocupado por outra turma (com outro
  professor) no mesmo dia da semana e horário, dentro do mesmo período — afinal, duas turmas
  diferentes não podem usar a mesma sala ao mesmo tempo.

Em qualquer um dos dois casos, o sistema **vai impedir salvar** e vai mostrar qual é a turma
conflitante, para que você possa ajustar o dia, o horário, o professor ou o espaço.

Além disso, se o **número de alunos previstos** informado for maior que a **capacidade** do
espaço escolhido, o sistema também impede salvar e mostra a capacidade máxima permitida.

## 6. Ver o calendário

A tela de **Turmas** mostra um calendário com todas as aulas de todas as turmas, cada uma
destacada com a cor do professor responsável — é possível alternar entre as visões de **Dia,
Semana, Mês, Semestre e Ano**, usando os botões no topo do calendário. Use as setas para
navegar entre os períodos.

Nas turmas de Aprendizagem, os **dias de prática** (na empresa) aparecem com **borda tracejada**
na cor do professor, para diferenciar das aulas de teoria no SENAC.

## 7. Gerar PDF

Você pode baixar um PDF de duas formas:

- **PDF da turma**: na lista de turmas, clique em **Baixar PDF** ao lado da turma desejada.
  O PDF traz os dados da turma (incluindo espaço e número de alunos previstos, quando
  preenchidos), a previsão de encerramento (e o atraso, se houve adiamento), as datas de cada
  UC, o calendário completo de aulas (data e dia da semana) e um resumo de quantas horas
  ocorrem em cada mês.
- **PDF do professor**: na lista de professores, clique em **Baixar PDF** ao lado do nome.
  O PDF traz os dados do professor e a agenda consolidada de todas as turmas dele (útil para
  o professor conferir sua própria agenda, mesmo sem acessar o sistema).

## Backup: por que é tão importante

Os dados cadastrados (professores, cursos, turmas, espaços, feriados customizados) ficam salvos **apenas
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
