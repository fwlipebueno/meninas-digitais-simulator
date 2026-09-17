**Português** · [English](README.en.md)

[![CI](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml)

# Simulador Web Interativo de Informática Básica

Ambiente de prática para as participantes do **Meninas Digitais UTFPR-CP**, projeto de extensão da UTFPR, Campus Cornélio Procópio. Voltado principalmente a meninas de 12 a 18 anos, apoia o nivelamento de informática básica para atividades como a Technovation Girls.

As atividades previstas seguem **instrução → ação da participante → validação → feedback imediato**, com dados temporários durante a sessão, sem alterar arquivos, contas ou serviços reais.

## Estado atual

Base inicial do repositório, correspondente à **PB-04** do cronograma: ambiente de desenvolvimento, testes e CI com entrega de artefatos. A interface web apresenta os quatro módulos, seguindo as cores, a organização e o logo do protótipo validado. **As atividades ainda não estão implementadas.**

| Módulo previsto           | Conteúdo                                                                                 | Requisitos    |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------- |
| Programas / Windows       | Abrir, fechar, alternar e gerenciar programas e janelas                                  | RF-01 a RF-21 |
| Arquivos / Bloco de Notas | Criar, salvar, renomear e excluir arquivos                                               | RF-22 a RF-30 |
| E-mail / Gmail            | Criar conta, fazer login, compor, enviar e descartar mensagens simuladas                 | RF-31 a RF-45 |
| Google Docs               | Interface, formatação, inserção, exportação, ferramentas e colaboração/revisão simuladas | RF-46 a RF-75 |

A API expõe apenas `GET /health`, que responde `200` com `{"status":"ok"}`. A inicialização verifica a conexão com PostgreSQL via Drizzle, sem criar tabelas. O endpoint indica que o processo responde; não é uma verificação contínua do banco. A tela inicial não depende da API.

O modelo de dados aguarda a etapa de análise e validação. Não há autenticação real, persistência de dados pessoais, integrações externas ou provedor de hospedagem definido.

### Requisitos de desenvolvimento

A validação do protótipo em 12/09/2026 identificou três ajustes para as atividades: incluir opção de retorno, destacar o controle de atalhos e habilitar minimizar, maximizar e fechar no Bloco de Notas simulado.

O desenvolvimento considera como limites **500 ms** para interações simples (RNF-01) e **200 ms** para atualização de buscas e filtros (RNF-02). Os módulos devem oferecer fontes de pelo menos 14px e contraste adequado (RNF-06), atalhos sem conflitos (RNF-08), feedback claro e adequado ao público (RNF-09) e senhas simuladas mascaradas (RNF-10). A tela atual usa fonte base de 16px e foco de teclado visível; o desempenho das atividades será medido quando forem implementadas.

## Stack e organização

React, TypeScript e Vite na web; Node.js, TypeScript e Express na API; PostgreSQL e Drizzle para o banco; Zod na validação de ambiente. Vitest e Playwright cobrem testes; Docker Compose provisiona o banco. O monorepo usa npm workspaces, Git e GitHub, com ESLint, Prettier e TypeScript strict.

```text
apps/
  web/                 Tela inicial em React e CSS próprio
  api/                 Express, ambiente e conexão com o banco
tests/e2e/             Smoke test da web compilada
.github/workflows/     CI e entrega por tag
compose.yaml          PostgreSQL de desenvolvimento
```

## Execução local

Requisitos: **Node.js 24.x**, **npm 11.x**, Git e Docker com Compose v2 ou superior em execução. `.nvmrc` registra o Node recomendado e testado (**24.21.0**), e `packageManager` em `package.json` registra o npm que gerou o lockfile (**11.19.0**). As portas 5173, 3001 e 5432 precisam estar livres.

```sh
git clone https://github.com/fwlipebueno/meninas-digitais-simulator.git
cd meninas-digitais-simulator
npm ci
```

Copie `.env.example` para `.env` na raiz: `cp .env.example .env` em macOS/Linux ou `Copy-Item .env.example .env` no PowerShell. Os valores de exemplo são exclusivos do desenvolvimento local.

```sh
npm run db:up
npm run dev
```

Abra [localhost:5173](http://localhost:5173). A API responde em [localhost:3001/health](http://localhost:3001/health). `db:up` aguarda o banco ficar pronto; web e API executam no computador com recarregamento durante a edição. Encerre-as com `Ctrl+C`. Use `npm run db:down` para parar o banco, preservando seu volume.

Se a API não iniciar, confira o serviço Docker, as portas e `DATABASE_URL`. É possível executar apenas a interface web com `npm run dev -w apps/web`, sem o banco.

### Variáveis de ambiente

A API lê `.env` da raiz nos scripts de desenvolvimento e execução. Variáveis já definidas no processo têm precedência. Zod valida `PORT` e `DATABASE_URL` antes da conexão, sem exibir suas credenciais nos erros. A web não recebe credenciais nem precisa de variáveis nesta etapa.

| Variável            | Uso / valor de exemplo                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `PORT`              | Porta HTTP da API; padrão `3001`, inteiro entre 1 e 65535                                           |
| `DATABASE_URL`      | Conexão PostgreSQL obrigatória: `postgresql://simulator:local-development@localhost:5432/simulator` |
| `POSTGRES_USER`     | Usuário criado pelo Compose: `simulator`                                                            |
| `POSTGRES_PASSWORD` | Senha local de exemplo: `local-development`                                                         |
| `POSTGRES_DB`       | Banco criado pelo Compose: `simulator`                                                              |

Ao alterar usuário, senha ou banco, ajuste também `DATABASE_URL`. As variáveis `POSTGRES_*` inicializam um volume novo; alterá-las não modifica credenciais de um volume existente. `.env` não é versionado.

## Comandos e testes

Execute na raiz:

| Comando             | Finalidade                                                    |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Iniciar web e API juntas                                      |
| `npm run build`     | Gerar `apps/web/dist` e `apps/api/dist`                       |
| `npm run lint`      | Verificar ESLint e formatação Prettier                        |
| `npm run format`    | Aplicar a formatação                                          |
| `npm run typecheck` | Verificar tipos da aplicação, configurações e testes          |
| `npm test`          | Testar `/health` por HTTP e validação de ambiente com Vitest  |
| `npm run test:e2e`  | Testar a web compilada com Playwright; requer build prévio    |
| `npm run check`     | Executar lint, tipos, Vitest, build e Playwright, nessa ordem |
| `npm run db:up`     | Iniciar PostgreSQL e aguardar disponibilidade                 |
| `npm run db:down`   | Parar PostgreSQL sem excluir o volume                         |

Antes da primeira execução de Playwright, instale o navegador:

```sh
npx playwright install chromium
npm run check
```

Em Linux, use `npx playwright install --with-deps chromium` para instalar também as dependências do sistema. O smoke test inicia seu servidor na porta 4173 e verifica os módulos, a indicação de indisponibilidade, o acesso por teclado, erros de execução e ausência de rolagem horizontal em duas larguras. Os testes não exigem banco e cobrem somente a base atual. O relatório fica em `playwright-report/`.

## CI e entrega

O workflow `CI` executa `npm ci` e `npm run check` em pull requests e pushes para `main`. Tags `v*` passam pelas mesmas validações e publicam artefatos `web-<tag>` e `api-<tag>` no próprio workflow. Falhas no smoke test preservam o relatório para diagnóstico.

O artefato web contém arquivos estáticos. O artefato API inclui JavaScript compilado, manifests, lockfile e exemplo de ambiente. Após extraí-lo, configure `.env` na raiz e execute `npm ci --workspace apps/api --omit=dev`, seguido de `npm start -w apps/api`, com PostgreSQL acessível. Não inclui dependências instaladas nem segredos. Não há deploy automático: a escolha de hospedagem permanece para a etapa de implantação.

## Contribuição

Use branches e PRs pequenos, mensagens de commit no formato Conventional Commits e relacione o requisito quando aplicável. O merge exige revisão e CI verde. Veja [CONTRIBUTING.md](CONTRIBUTING.md). As tarefas são acompanhadas no Trello.

## Equipe

- Felipe de Almeida Bueno
- Emmanuely Antonia Brandão
- Samuel Ueno Fernandes
- Antonio Carlos Ferreira
