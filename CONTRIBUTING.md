# Contribuição

As tarefas são acompanhadas no Kanban do Trello. Combine o escopo com a equipe antes de iniciar.

- Crie uma branch pequena e orientada à tarefa, como `feat/abrir-programa` ou `fix/foco-do-menu`.
- Use Conventional Commits como convenção humana: `feat:`, `fix:`, `docs:`, `test:` ou `chore:` seguido de uma descrição objetiva.
- Abra um PR pequeno, explicando o que mudou, por quê e como foi validado. Relacione o requisito ou a tarefa do cronograma quando aplicável.
- Execute `npm run check`. O smoke test requer Chromium instalado com `npx playwright install chromium`.
- Faça merge somente com revisão e CI verde.

O [README](README.md) descreve a preparação do ambiente. O protótipo orienta os fluxos; as atividades devem permanecer simuladas, sem operar arquivos, contas ou serviços reais.
