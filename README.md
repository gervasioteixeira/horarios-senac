# Horários Senac

Sistema interno de gestão de cursos: agendamento de turmas, organização de professores e
cálculo automático de calendário letivo (data de término e distribuição mensal de aulas/horas),
com bloqueio de choque de horário entre turmas do mesmo professor.

SPA em Vue 3, sem back-end — os dados ficam salvos no navegador (localStorage), com backup via
download/upload de JSON e geração de PDF por turma e por professor. Publicado em GitHub Pages.

Veja [CLAUDE.md](./CLAUDE.md) para detalhes técnicos e decisões de arquitetura, e
[docs/MANUAL-DO-USUARIO.md](./docs/MANUAL-DO-USUARIO.md) para o manual de uso.

## Comandos

```bash
npm install       # instalar dependências
npm run dev        # ambiente de desenvolvimento
npm run test        # rodar a suite de testes
npm run build        # build de produção
```
