# Gestor de Oficinas — guia do projeto

> Documento de retomada. Carregado automaticamente pelo opencode em novas sessões.
> Última atualização: sessão de construção inicial (API + Web + testes + RLS).

## Visão do produto
SaaS **multiempresa** de gestão de **oficina automotiva**: cadastros (clientes/veículos/
fornecedores/peças/serviços), agenda, inspeção, ordens de serviço, orçamento → fatura →
pagamento, estoque por ledger, compras, despesas e relatórios. Admin web em Next.js com
tema inspirado no FinTrust UI Kit (light/dark).

## Stack e layout do monorepo
- **pnpm + Turborepo**
- `apps/api` — NestJS 10 + Prisma 6 + PostgreSQL
- `apps/web` — Next.js 15 (App Router) + React 19 + Tailwind + React Query + lucide-react
- `apps/mobile` — Expo (stub, próxima fase: offline com PowerSync)
- `packages/database` — schema Prisma, migrations, seed, seed mock, `rls.sql`
- `packages/shared` — catálogo de permissões e templates de papéis

## Como rodar
Pré-requisitos: Node ≥ 20 e pnpm (via corepack). Banco no container Docker
`gestor-oficinas-db` (Postgres na porta **5433**).

`.env` na raiz (ver `.env.example`): `DATABASE_URL` (owner/superusuário),
`APP_DATABASE_URL` (papel de aplicação `app_gestor`), `JWT_SECRET`, `REFRESH_SECRET`,
`WEB_URL`, `NEXT_PUBLIC_API_URL`.

```
pnpm install
pnpm --filter @gestor/database db:generate
pnpm --filter @gestor/database db:migrate      # ou db:deploy
pnpm db:rls                                    # cria app_gestor + grants + políticas
pnpm db:seed                                   # permissões, tenant oficina-demo, papéis
pnpm db:seed:mock                              # dados de demonstração

pnpm --filter @gestor/api dev                  # API  -> http://localhost:3333/api
pnpm --filter @gestor/web dev                  # Web  -> http://localhost:3000
```
Login demo: **owner@oficina.local / password**

Testes: `pnpm --filter @gestor/api test` (e2e, 20 testes)
Tipos: `pnpm --filter @gestor/api typecheck` e `pnpm --filter @gestor/web typecheck`
Limpar build do web: `pnpm clean`

## Arquitetura e convenções (importante)
- **Multi-tenant**: `tenant_id` em toda tabela de negócio. Isolamento real via **RLS** no
  Postgres; a aplicação conecta com o papel **não-superusuário** `app_gestor` (`APP_DATABASE_URL`).
- **Transação por requisição**: `TenantContextInterceptor` abre uma transação, define
  `app.current_tenant` (`SET LOCAL`) e executa o handler dentro dela. `PrismaService.client`
  devolve essa transação; `PrismaService.runInTransaction` reaproveita-a (não aninha).
- **Extensão Prisma de escopo** injeta `tenantId` em `create`/listas (defesa em profundidade).
- **Tabelas sem RLS** (auth/plataforma): `users`, `tenants`, `roles`, `permissions`,
  `role_permissions`, `membership_roles`, `memberships`, `refresh_tokens`.
- **RBAC**: catálogo em `packages/shared/src/permissions.ts` (`feature.acao`); papéis default
  em `roles.ts`. Rotas usam `@RequirePermissions('recurso.acao')`. Owner recebe `['*']`.
- **Serviços centrais**: `LineCalculatorService` (cálculo de linha) e `NumberSequenceService`
  (numeração transacional de documentos).
- **Modelagem**: dinheiro `Decimal(14,2)`, quantidades `Decimal(14,3)`, soft delete
  (`deletedAt`) onde aplicável, numeração única por tenant.

## Estado atual (implementado)
**API**: auth (JWT + refresh rotativo, `register`/provisionamento de tenant), branches,
customers, vehicles, appointments, **inspections** (templates versionados + execução com
resultado/aprovação), **job-cards** (máquina de estados, linhas, mecânicos), quotations,
invoices (pagamentos parciais + documento HTML), parts, **stock** (ledger + balances +
issue-to-job), suppliers, expenses, purchases (entrada no ledger + despesa automática),
reports (financial/stock/job-cards), users, roles/permissions.
**Endurecimento**: validação de env, helmet, throttler, CORS, filtro global de exceções,
health com ping no banco, shutdown gracioso, **RLS efetiva**.

**Web**: login, shell (sidebar/topbar, dark mode), dashboard (KPIs + gráficos), clientes,
veículos, filiais, equipe, papéis (matriz de permissões), agendamentos, inspeções,
checklists, orçamentos, OS (lista/detalhe), faturas (lista/detalhe + pagamento + documento),
peças, estoque, compras.

**Testes** (`apps/api/test`): `app.e2e-spec`, `rls.e2e-spec`, `flows.e2e-spec` → **20 testes**
(autenticação, isolamento entre tenants via RLS, RBAC e fluxo completo operação→orçamento→
fatura→pagamento→estoque).

## Backlog / próximos passos
1. **App mobile** do mecânico (Expo + **PowerSync**, offline-first).
2. **Serviço de PDF headless** (Playwright) consumindo `GET /invoices/:id/document`.
3. **Refino de UI** por tela (resumo de faturas All/Paid/Unpaid/Overdue, abas de settings,
   "Most Spent" nos relatórios).
4. **Testes**: `globalSetup` para limpar artefatos de teste; mais cobertura (inspeção, compras).
5. **Impressão** de laudo de inspeção/OS e etiquetas QR/barcode.
6. **SaaS**: billing/planos, onboarding self-service, limites por plano.
7. **Notificações** (e-mail/SMS) e lembretes de manutenção (agendados).
8. **Campos customizados**: schema existe, falta API + UI.
9. **Runbook de produção**: papel `app_gestor` real, segredos, backups, observabilidade.

## Decisões de arquitetura (fechadas)
Stack Node/TS; NestJS + Next + Expo; Postgres + Prisma; multi-tenant schema único +
`tenant_id` + RLS; **PowerSync** para offline; **OS unificada** (inspeção/reparo/serviço);
inspeção **versionada** com gate de fatura por aprovação; impostos relacionais por linha;
**estoque por ledger**; RBAC normalizado; PDF via serviço headless; monorepo pnpm+Turborepo.

## Documentos de referência
- `docs/analise-projetos-referencia.md` — análise dos 3 sistemas de oficina inspiradores.
- `docs/especificacao-dominio.md` — regras de domínio (inspeção, estados, pricing, estoque…).
- `docs/dicionario-dados-referencias.md` — dicionário/mapa canônico de entidades.
- `docs/referencia-layout-fintrust.md` — tokens e layout do UI kit (base do tema atual).

## Padrões de contribuição
- Antes de commitar: `typecheck` de api e web; `test` quando mexer em fluxos.
- Não commitar segredos (`.env` é gitignored). Migrations versionadas em `packages/database/prisma/migrations`.
- Respeitar sempre o escopo de tenant e preferir soft delete.
- Mensagens de commit descritivas (padrão `feat(api):`, `feat(web):`, `fix:`, `chore:`).
