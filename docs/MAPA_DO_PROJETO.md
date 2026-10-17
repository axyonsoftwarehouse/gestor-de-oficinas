# Mapa do Projeto: Gestor de Oficinas

> Gerado em 09/10/2026 · branch `main` · commit `83ac90f`
> Cobertura: **217 fichas de 229 arquivos de código + 12 exceções · 19 módulos · 18 processos**.

O Gestor de Oficinas é um SaaS multiempresa para oficinas automotivas. O painel cobre clientes, veículos, agenda, inspeções, ordens de serviço, orçamentos, faturas, pagamentos, peças, estoque, compras, despesas, fornecedores, serviços, relatórios, equipe e permissões.

O produto é um monorepo pnpm/Turborepo. `apps/web` reúne páginas React 19 e API Next.js 15; `packages/database` contém Prisma/PostgreSQL e RLS; `packages/shared` centraliza RBAC; `apps/mobile` ainda é um stub Expo.

Cada requisição protegida resolve sessão e permissões, abre uma transação, define o tenant corrente e então executa o service. A garantia principal de isolamento está no PostgreSQL por RLS.

## Como rodar

Pré-requisitos: Node ≥20, pnpm via Corepack e PostgreSQL/Neon. Variáveis obrigatórias estão em `.env.example`; valores reais não foram copiados.

```text
// comandos de operação (referência documental; não é trecho de código-fonte)
pnpm install
pnpm --filter @gestor/database db:generate
pnpm --filter @gestor/database db:deploy
pnpm db:rls
pnpm db:seed
pnpm --filter @gestor/web dev       # http://localhost:3000
pnpm db:test:up
pnpm --filter @gestor/web test
pnpm typecheck
pnpm --filter @gestor/web build
```

## Índice

- [Arquitetura](mapa/01-arquitetura.md) §1 — 19 módulos e configuração.
- [Processos ponta a ponta](mapa/02-processos.md) §2 — 18 processos e máquinas de estado.
- [Funcionalidades](mapa/03-funcionalidades.md) §3 — 29 capacidades e lacunas.
- [Modelo de dados](mapa/04-modelo-de-dados.md) §4 — 65 modelos e 23 enums.
- [Regras e convenções](mapa/05-regras-e-convencoes.md) §5 — transcritas, inferidas e sugeridas.
- [Problemas e dívidas](mapa/06-problemas-e-dividas.md) §6 — riscos, dívidas e propostas para o caderno.
- [Glossário](mapa/07-glossario.md) §7 — termos de domínio e arquitetura.
- [Verificação](mapa/08-verificacao.md) §8 — cobertura, reconciliação, comandos e índice de rotas.
- [Inventário completo](mapa/arquivos/00-inventario.md) §Inventário — 229 arquivos de código.
- [01 — Banco: modelo, runtime e segurança](mapa/arquivos/01-banco-modelo-e-seguranca.md) §1 — 6 arquivos.
- [02 — Banco: seeds, limpeza e migrations](mapa/arquivos/02-banco-seeds-e-migrations.md) §2 — 10 arquivos.
- [03 — Código compartilhado, mobile e ferramentas](mapa/arquivos/03-compartilhado-mobile-e-ferramentas.md) §3 — 5 arquivos.
- [04 — Frontend compartilhado](mapa/arquivos/04-frontend-base.md) §4 — 17 arquivos.
- [05 — Páginas e layouts web](mapa/arquivos/05-paginas-web.md) §5 — 24 arquivos.
- [06 — Infraestrutura do servidor](mapa/arquivos/06-infraestrutura-do-servidor.md) §6 — 14 arquivos.
- [07 — DTOs comuns e de cadastros](mapa/arquivos/07-dtos-comuns-e-cadastros.md) §7 — 25 arquivos.
- [08 — DTOs de operação](mapa/arquivos/08-dtos-operacao.md) §8 — 21 arquivos.
- [09 — DTOs financeiros](mapa/arquivos/09-dtos-financeiro.md) §9 — 13 arquivos.
- [10 — Serviços de cadastros e acesso](mapa/arquivos/10-servicos-cadastros.md) §10 — 12 arquivos.
- [11 — Serviços transacionais](mapa/arquivos/11-servicos-transacionais.md) §11 — 9 arquivos.
- [12 — API de acesso e cadastros](mapa/arquivos/12-api-acesso-e-cadastros.md) §12 — 15 arquivos.
- [13 — API de agenda e inspeções](mapa/arquivos/13-api-agenda-e-inspecoes.md) §13 — 10 arquivos.
- [14 — API de ordens de serviço](mapa/arquivos/14-api-ordens-de-servico.md) §14 — 7 arquivos.
- [15 — API de catálogos e estoque](mapa/arquivos/15-api-catalogos-e-estoque.md) §15 — 8 arquivos.
- [16 — API de fornecedores, compras e despesas](mapa/arquivos/16-api-compras-e-despesas.md) §16 — 7 arquivos.
- [17 — API de orçamentos](mapa/arquivos/17-api-orcamentos.md) §17 — 8 arquivos.
- [18 — API de faturas e relatórios](mapa/arquivos/18-api-faturas-e-relatorios.md) §18 — 11 arquivos.
- [19 — Testes](mapa/arquivos/19-testes.md) §19 — 7 arquivos.

## Por onde começar

Leia esta capa, depois [os processos](mapa/02-processos.md) §2, [a arquitetura](mapa/01-arquitetura.md) §1 e por fim o módulo da área que pretende alterar. Para decisões e histórico, consulte o [Caderno do Projeto](CADERNO_DO_PROJETO.md) §0.

> Este mapa é gerado — não edite à mão. Anotações, motivos e decisões vão no `CADERNO_DO_PROJETO.md`.
> Ignorados: `.git/`, `node_modules/`, `.next/`, `.turbo/`, `.vercel/`, `.pgtest/`, builds, caches, locks e arquivos `.env` reais.
