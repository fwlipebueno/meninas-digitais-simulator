**Português** · [English](README.en.md)

[![CI](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml)

# Simulador Web Interativo de Informática Básica

Ambiente de prática para as participantes do **Meninas Digitais UTFPR-CP**, projeto de extensão da UTFPR, Campus Cornélio Procópio. Voltado principalmente a meninas de 12 a 18 anos, apoia o nivelamento de informática básica para atividades como a Technovation Girls.

As atividades previstas seguem **instrução → ação da participante → validação → feedback imediato**. Os dados manipulados nas atividades são temporários e apenas o progresso por sessão anônima é registrado, sem alterar arquivos, contas ou serviços reais.

## Estado atual

A fundação **PB-04** fornece o ambiente de desenvolvimento, testes e CI. O **Incremento 1 — Programas (RF-01 a RF-21)** permite abrir, fechar e alternar programas, com instruções, feedback, repetição e retorno à seleção. O **Incremento 2 — Arquivos (RF-22 a RF-30)** está disponível para criar, salvar, renomear e excluir arquivos. O **Incremento 3 — E-mail (RF-31 a RF-45)** está disponível para criar contas, fazer login, compor, enviar e descartar mensagens simuladas. Google Docs continua em desenvolvimento. A interface preserva as cores e o logo do protótipo validado. A web já se integra à API para registrar e restaurar o progresso das atividades por sessão anônima.

Os atalhos reservados do computador são ensinados por controles dentro da página. O estado das janelas é local e reiniciado ao trocar de método, repetir ou sair da atividade. No módulo Programas, o Bloco de Notas permite minimizar, maximizar, restaurar e fechar. No módulo Arquivos, o documento e o arquivo salvo ficam somente no estado da atividade; repetir ou sair descarta esses dados. No módulo E-mail, contas criadas ficam somente em memória enquanto o módulo está aberto; sair dele ou recarregar descarta as contas. Mensagens e rascunhos existem apenas na atividade, sendo descartados ao repetir ou sair dela. O cadastro verifica disponibilidade e senhas com pelo menos 8 caracteres, letras e números; os campos de senha são sempre mascarados. Só o clique em “Concluir atividade”, após atingir o objetivo, registra o progresso. Cada atividade mantém sua conclusão individual, repetição e retorno à seleção. Quando todas estiverem concluídas, “Ver resumo do módulo” abre o resumo adicional. Repetir uma atividade ou módulo não apaga conclusões; a seleção indica as atividades já concluídas. A API guarda o progresso (quais atividades foram concluídas) por sessão anônima, mas não grava, baixa nem persiste arquivos, contas ou outros dados reais.

| Módulo previsto           | Conteúdo                                                                                 | Requisitos    |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------- |
| Programas / Windows       | Abrir, fechar, alternar e gerenciar programas e janelas                                  | RF-01 a RF-21 |
| Arquivos / Bloco de Notas | Criar, salvar, renomear e excluir arquivos                                               | RF-22 a RF-30 |
| E-mail / Gmail            | Criar conta, fazer login, compor, enviar e descartar mensagens simuladas                 | RF-31 a RF-45 |
| Google Docs               | Interface, formatação, inserção, exportação, ferramentas e colaboração/revisão simuladas | RF-46 a RF-75 |

A API expõe `GET /health` (responde `200` com `{"status":"ok"}`), `GET /progress?sessionId=<uuid>` (devolve `{"completedActivityIds":[...]}`, as atividades já concluídas na sessão) e `POST /completions` (registra uma conclusão; recebe `{"sessionId":"<uuid>","activityId":"<id>"}` e é idempotente). Identificadores inválidos ou campos adicionais respondem `400`; o corpo JSON está limitado a 4kb. O CORS permanece aberto nesta fase de desenvolvimento. A tela inicial não depende da API: se ela estiver indisponível, o simulador continua funcionando, apenas sem restaurar nem registrar o progresso.

O modelo de dados está definido em `apps/api/src/schema.ts` (Drizzle), com três tabelas: `training_session` (sessão anônima, `id` UUID), `activity` (catálogo, `id` texto) e `activity_completion` (conclusões, chave composta `sessionId` + `activityId`). O `db:seed` popula 14 atividades dos quatro módulos. O UUID fica em `sessionStorage`, preservado nos recarregamentos da aba; se o storage falhar, um único UUID permanece em memória durante o uso da página. A sessão no banco é criada no primeiro registro de conclusão. Não há autenticação real, persistência de dados pessoais, integrações externas ou provedor de hospedagem definido.

### Requisitos de desenvolvimento

A validação do protótipo em 12/09/2026 identificou três ajustes para as atividades: incluir opção de retorno, destacar o controle de atalhos e habilitar minimizar, maximizar e fechar no Bloco de Notas simulado.

O desenvolvimento considera como limites **500 ms** para interações simples (RNF-01) e **500 ms** para atualização de buscas e filtros (RNF-02). Os módulos devem oferecer fontes de pelo menos 14px e contraste adequado (RNF-06), atalhos sem conflitos (RNF-08), feedback claro e adequado ao público (RNF-09) e senhas simuladas mascaradas (RNF-10). A interface usa fonte base de 16px, textos auxiliares de pelo menos 14px e foco de teclado visível. Programas, Arquivos e E-mail usam atualizações locais, sem atrasos artificiais; os testes validam comportamento, sem impor limites temporais dependentes da máquina.

## Stack e organização

React, TypeScript e Vite na web; Node.js, TypeScript e Express na API; PostgreSQL e Drizzle para o banco; Zod na validação de ambiente. Vitest e Playwright cobrem testes; Docker Compose provisiona o banco. O monorepo usa npm workspaces, Git e GitHub, com ESLint, Prettier e TypeScript strict.

```text
apps/
  web/                       Tela inicial e módulos Programas, Arquivos e E-mail em React e CSS próprio
    src/api.ts               Sessão anônima (sessionStorage ou memória) e clientes de /progress e /completions
    src/ModuleCompletion.tsx Tela de conclusão de módulo
    src/programs/            Navegação, estado das janelas e atividades Abrir/Fechar/Alternar
    src/files/               Navegação, documento e arquivo temporários; Criar/Salvar/Renomear/Excluir
    src/mail/                Cadastro, login, composição e mensagens temporárias; progresso das 3 atividades
  api/                       Express, ambiente, conexão com o banco (Drizzle) e endpoints
    src/schema.ts            Tabelas training_session, activity e activity_completion
    src/migrate.ts           Aplica as migrations de drizzle/
    src/seed.ts              Popula o catálogo com as 14 atividades
    drizzle/                 Migrations geradas pelo drizzle-kit
tests/e2e/                   Tela inicial, módulos, resumo e integração simulada com a API
tests/integration/           Persistência em PostgreSQL real, separada de npm run check
.github/workflows/           CI e entrega por tag
compose.yaml                PostgreSQL de desenvolvimento
```

## Execução local

Requisitos: **Node.js 24.x**, **npm 11.x**, Git e Docker com Compose v2 ou superior em execução. `.nvmrc` registra o Node recomendado e testado (**24.21.0**), e `packageManager` em `package.json` registra o npm que gerou o lockfile (**11.19.0**). As portas 5173, 3001 e 5433 precisam estar livres.

```sh
git clone https://github.com/fwlipebueno/meninas-digitais-simulator.git
cd meninas-digitais-simulator
npm ci
```

Copie `.env.example` para `.env` na raiz: `cp .env.example .env` em macOS/Linux ou `Copy-Item .env.example .env` no PowerShell. Os valores de exemplo são exclusivos do desenvolvimento local.

```sh
npm run db:up
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
npm run dev
```

Abra [localhost:5173](http://localhost:5173). A API responde em [localhost:3001/health](http://localhost:3001/health). `db:up` aguarda o banco ficar pronto; `db:migrate` e `db:seed` preparam o schema e o catálogo de atividades e são idempotentes — execute-os na primeira vez ou após mudanças no schema. Web e API executam no computador com recarregamento durante a edição. Encerre-as com `Ctrl+C`. Use `npm run db:down` para parar o banco, preservando seu volume.

Se a API não iniciar, confira o serviço Docker, as portas e `DATABASE_URL`. É possível executar apenas a interface web com `npm run dev -w apps/web`, sem o banco — nesse caso, o progresso não é registrado nem restaurado.

### Variáveis de ambiente

A API lê `.env` da raiz quando ele existir; também aceita apenas variáveis do processo. Variáveis já definidas no processo têm precedência. Zod valida `PORT` e `DATABASE_URL` antes da conexão, sem exibir suas credenciais nos erros. A web não recebe credenciais; opcionalmente aceita `VITE_API_URL` (lida em tempo de build pelo Vite) para apontar para outra API, com padrão `http://127.0.0.1:3001`. Defina `VITE_API_URL` no processo que inicia o Vite ou em `apps/web/.env.local`; o Vite não lê o `.env` da raiz. Nunca use variáveis `VITE_*` para credenciais.

| Variável            | Uso / valor de exemplo                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `PORT`              | Porta HTTP da API; padrão `3001`, inteiro entre 1 e 65535                                           |
| `DATABASE_URL`      | Conexão PostgreSQL obrigatória: `postgresql://simulator:local-development@localhost:5433/simulator` |
| `POSTGRES_USER`     | Usuário criado pelo Compose: `simulator`                                                            |
| `POSTGRES_PASSWORD` | Senha local de exemplo: `local-development`                                                         |
| `POSTGRES_DB`       | Banco criado pelo Compose: `simulator`                                                              |
| `VITE_API_URL`      | Opcional (web): URL base da API; padrão `http://127.0.0.1:3001`                                     |

Ao alterar usuário, senha ou banco, ajuste também `DATABASE_URL`. As variáveis `POSTGRES_*` inicializam um volume novo; alterá-las não modifica credenciais de um volume existente. `.env` não é versionado.

## Comandos e testes

Execute na raiz:

| Comando                                | Finalidade                                                        |
| -------------------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                          | Iniciar web e API juntas                                          |
| `npm run build`                        | Gerar `apps/web/dist` e `apps/api/dist`                           |
| `npm run lint`                         | Verificar ESLint e formatação Prettier                            |
| `npm run format`                       | Aplicar a formatação                                              |
| `npm run typecheck`                    | Verificar tipos da aplicação, configurações e testes              |
| `npm test`                             | Testar saúde, contratos HTTP e ambiente com Vitest                |
| `npm run test:integration`             | Testar persistência real; requer build da API e TEST_DATABASE_URL |
| `npm run test:e2e`                     | Testar a web compilada com Playwright; requer build prévio        |
| `npm run check`                        | Executar lint, tipos, Vitest, build e Playwright, nessa ordem     |
| `npm run db:up`                        | Iniciar PostgreSQL e aguardar disponibilidade                     |
| `npm run db:down`                      | Parar PostgreSQL sem excluir o volume                             |
| `npm run db:generate -w apps/api`      | Gerar migration a partir do schema (`drizzle-kit`)                |
| `npm run db:migrate -w apps/api`       | Aplicar as migrations no PostgreSQL                               |
| `npm run db:seed -w apps/api`          | Popular o catálogo com as 14 atividades                           |
| `npm run db:migrate:built -w apps/api` | Aplicar migrations pelo build dist                                |
| `npm run db:seed:built -w apps/api`    | Popular o catálogo pelo build dist                                |

Antes da primeira execução de Playwright, instale o navegador:

```sh
npx playwright install chromium
npm run check
```

Em Linux, use `npx playwright install --with-deps chromium` para instalar também as dependências do sistema. Playwright inicia seu servidor na porta 4173 e verifica a tela inicial, os fluxos Abrir, Fechar e Alternar, as atividades Criar, Salvar, Renomear e Excluir, cadastro, login, envio e descarte de e-mails e a tela de conclusão de cada módulo, além da integração com a API por requisições simuladas, incluindo teclado, retorno, repetição, confirmação de tarefa sem resposta e consistência entre janelas, tarefas e miniaturas. Os cenários rodam em desktop e em 390 × 844, sem exigir banco. As atualizações são locais e imediatas; não há testes de tempo dependentes da velocidade da máquina. O relatório fica em `playwright-report/`.

O teste PostgreSQL é separado de `npm run check`. Defina `TEST_DATABASE_URL` para um PostgreSQL de teste com permissão `CREATE DATABASE`, nunca para um ambiente de produção. O teste cria e remove seu próprio banco isolado, executa migration/seed compilados duas vezes e verifica conclusões duplicadas, timestamps e isolamento de duas sessões. Exemplo com container descartável:

```sh
docker run --rm -d --name simulator-progress-test -e POSTGRES_USER=simulator -e POSTGRES_PASSWORD=integration-test -e POSTGRES_DB=simulator_test -p 127.0.0.1:55432:5432 postgres:17.11-alpine
docker exec simulator-progress-test pg_isready -U simulator -d simulator_test
npm run build -w apps/api
npm run test:integration
docker stop simulator-progress-test
```

Aguarde o `pg_isready` indicar disponibilidade e defina `TEST_DATABASE_URL=postgresql://simulator:integration-test@127.0.0.1:55432/simulator_test` no processo antes de executar o teste.

## CI e entrega

O workflow `CI` executa `npm ci`, `npm run check` e o teste de integração com PostgreSQL efêmero em pull requests e pushes para `main`. Tags `v*` passam pelas mesmas validações e publicam artefatos `web-<tag>` e `api-<tag>` no próprio workflow. Falhas no smoke test preservam o relatório para diagnóstico.

O artefato web contém arquivos estáticos. O artefato API inclui JavaScript compilado, migrations em `apps/api/drizzle/`, manifests, lockfile e exemplo de ambiente. Após extraí-lo, configure as variáveis do processo ou `.env` na raiz e execute `npm ci --workspace apps/api --omit=dev`. Com PostgreSQL acessível, execute `npm run db:migrate:built -w apps/api` e `npm run db:seed:built -w apps/api` antes de `npm start -w apps/api`. O caminho das migrations é relativo ao código, independente do working directory. Não inclui dependências instaladas nem segredos. Não há deploy automático: a escolha de hospedagem permanece para a etapa de implantação.

## Contribuição

Use branches e PRs pequenos, mensagens de commit no formato Conventional Commits e relacione o requisito quando aplicável. O merge exige revisão e CI verde. Veja [CONTRIBUTING.md](CONTRIBUTING.md). As tarefas são acompanhadas no Trello.

## Equipe

- Felipe de Almeida Bueno
- Emmanuely Antonia Brandão
- Samuel Ueno Fernandes
- Antonio Carlos Ferreira
