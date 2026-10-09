# Gestor de Oficinas — guia do projeto

> Documento de retomada. Carregado automaticamente pelo opencode em novas sessões.
> Arquitetura atual: **Next.js full stack** na **Vercel** + **PostgreSQL (Neon)** +
> **Better Auth**. (A antiga API NestJS foi descomissionada.)

## Visão do produto
SaaS **multiempresa** de gestão de **oficina automotiva**: cadastros
(clientes/veículos/fornecedores/peças), agenda, inspeção, ordens de serviço,
orçamento → fatura → pagamento, estoque por ledger, compras, despesas e
relatórios. Admin web em Next.js com tema inspirado no FinTrust UI Kit (light/dark).

## Stack e layout do monorepo
- **pnpm + Turborepo**
- `apps/web` — Next.js 15 (App Router) + React 19 + Tailwind + React Query + lucide.
  É o **app e a API** (Route Handlers em `src/app/api/**`) e a auth (Better Auth).
- `apps/mobile` — Expo (stub; próxima fase: offline com PowerSync).
- `packages/database` — schema Prisma, migrations, seed, `rls.sql`, `app-role.sql`.
- `packages/shared` — catálogo de permissões e templates de papéis.

## Como rodar
Pré-requisitos: Node ≥ 20 e pnpm (via corepack). Banco: PostgreSQL (Neon em
produção; local/Dev pode ser um Postgres comum).

`.env` na raiz (ver `.env.example`): `DATABASE_URL`, `APP_DATABASE_URL`
(papel `app_gestor`, NOBYPASSRLS), `DIRECT_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `NEXT_PUBLIC_API_URL`.

```
pnpm install
pnpm --filter @gestor/database db:generate
pnpm --filter @gestor/database db:deploy      # migrations (usa DIRECT_URL)
pnpm db:rls                                   # políticas de RLS
pnpm db:seed                                  # domínio demo (tenant/oficina)
pnpm --filter @gestor/web seed:owner          # owner via Better Auth
pnpm --filter @gestor/web dev                 # Web/API -> http://localhost:3000
```
Login demo: **owner@oficina.local / password**

Testes (Vitest no web; exigem um **banco de teste dedicado**). Há um
**PostgreSQL portable** (sem Docker, sem admin, sem serviço) baixado para
`.pgtest/` e controlado por `scripts/pg-test.ps1`:
```
pnpm db:test:up                 # baixa (1x), inicializa e sobe o Postgres na porta 5434
# .env (o papel app_gestor/RLS é criado automaticamente pelo setup dos testes):
# TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/gestor_test"
# TEST_DIRECT_URL="postgresql://postgres:postgres@localhost:5434/gestor_test"
# TEST_APP_DATABASE_URL="postgresql://app_gestor:app_gestor@localhost:5434/gestor_test"

pnpm --filter @gestor/web test  # o setup aplica migrations, app-role, RLS e limpa as tabelas antes/depois
pnpm db:test:down               # para o banco (nada fica rodando em background)
```
Outros comandos: `db:test:status`, `db:test:reset` (recria o cluster),
`db:test:destroy` (apaga binários e dados). Na CI o Postgres é provido como
service (`.github/workflows/ci.yml`).
Tipos: `pnpm typecheck`. Build: `pnpm --filter @gestor/web build`.

## Arquitetura e convenções (importante)
- **Multi-tenant**: `tenant_id` em toda tabela de negócio. Isolamento real via
  **RLS** no Postgres; o runtime conecta com o papel **não-superusuário**
  `app_gestor` (NOBYPASSRLS) via `APP_DATABASE_URL`.
- **Transação por requisição**: `runRoute(...)` (em `src/server/auth/with-route.ts`)
  autentica, checa permissões, abre uma transação, define
  `set_config('app.current_tenant', <id>, true)` e executa o handler. `getDb()`
  devolve a transação corrente (ou o client base).
- **Extensão Prisma de escopo** injeta `tenantId` em creates/listas (defesa em
  profundidade; a RLS é a garantia principal).
- **Tabelas sem RLS** (plataforma): `users`, `tenants`, `roles`, `permissions`,
  `role_permissions`, `membership_roles`, `memberships`, `sessions`, `accounts`,
  `verifications`.
- **Auth**: Better Auth (sessão por cookie). Tabelas `sessions`/`accounts`.
  `requireSession()` resolve usuário → vínculo → oficina → permissões.
- **RBAC**: catálogo em `packages/shared/src/permissions.ts` (90 permissões, 21
  features); papéis default em `roles.ts` (owner/manager/advisor/mechanic/accountant).
  Rotas usam `runRoute({ permissions: ['recurso.acao'] })`.
- **Serviços centrais**: `LineCalculatorService` (cálculo de linha) e
  `NumberSequenceService` (numeração transacional).
- **Convenção de módulo**: `src/server/dtos/*`, `src/server/services/*.service.ts`,
  `src/app/api/**/route.ts`. Todo handler Prisma: `export const runtime = 'nodejs'`.
- **Modelagem**: dinheiro `Decimal(14,2)`, quantidades `Decimal(14,3)`, soft delete
  (`deletedAt`) onde aplicável, numeração única por tenant.

## Estado atual (implementado)
**Web/API** (`apps/web`): auth (Better Auth + provisionamento de tenant),
filiais, clientes, veículos, agendamentos, inspeções (templates versionados +
execução/aprovação), job-cards (máquina de estados, linhas, mecânicos),
orçamentos, faturas (pagamentos parciais + documento HTML), peças, estoque
(ledger + saldos + issue-to-job), fornecedores, despesas, compras (entrada no
ledger + despesa automática), relatórios, usuários, papéis/permissões. `GET /api/health`.

**Qualidade**: `typecheck` e `next build` verdes; **RLS validada** no Neon;
testes Vitest (`rls`, `flows`, `auth`).

**Deploy**: **ao vivo** em https://gestor-de-oficinas.vercel.app (Vercel, região
`gru1`) + Neon. Repositório em https://github.com/axyonsoftwarehouse/gestor-de-oficinas
(Vercel conectada a ele). Ver `docs/deploy-vercel.md` e `.github/workflows/{ci,migrate}.yml`.
Obs.: `turbo.json` declara as envs em `globalEnv` (o `envMode: strict` do Turbo
remove do build qualquer variável não declarada).

## Backlog / próximos passos
1. **App mobile** do mecânico (Expo + **PowerSync**, offline-first).
2. **Serviço de PDF headless** (Playwright) consumindo `GET /api/invoices/:id/document`.
3. **Catálogo de Serviços** (modelo existe, sem API/tela), **anexos/notas** e
   **campos customizados** (schema existe, faltam API + UI).
4. **Refino de UI** por tela (resumo de faturas, abas de settings, "Most Spent").
5. **SaaS**: billing/planos, onboarding self-service, limites por plano.
6. **Notificações** (e-mail/SMS) e lembretes de manutenção (agendados).
7. **Impressão** de laudo/anexos e etiquetas QR/barcode.
8. **Backups offsite** (Neon free não tem backup agendado) e rotação de segredos.
9. Observabilidade/alertas e runbook de produção.

## Decisões de arquitetura (fechadas)
Stack Node/TS; **Next.js full stack** (Route Handlers) + **Vercel**; Postgres
(Neon) + Prisma; multi-tenant schema único + `tenant_id` + **RLS**; **Better Auth**;
**PowerSync** para offline; **OS unificada**; inspeção **versionada** com gate de
fatura por aprovação; impostos relacionais por linha; **estoque por ledger**; RBAC
normalizado; PDF via serviço headless; monorepo pnpm+Turborepo.

## Documentos de referência
- `docs/escopo-projeto-e-roadmap.md` — escopo (negócio + técnico) e roadmap.
- `docs/plano-migracao-neon-vercel.md` — execução da migração.
- `docs/deploy-vercel.md` — runbook de deploy.
- `docs/especificacao-dominio.md` — regras de domínio.
- `docs/dicionario-dados-referencias.md` — dicionário de entidades.
- `docs/analise-projetos-referencia.md` — análise dos sistemas inspiradores.
- `docs/referencia-layout-fintrust.md` — tokens e layout do UI kit.

## Padrões de contribuição
- Antes de commitar: `pnpm typecheck`; `build` quando mexer em rotas; `test` quando
  mexer em fluxos (com banco de teste).
- Não commitar segredos (`.env` é gitignored). Rotacionar segredos que circularam.
- Migrations versionadas em `packages/database/prisma/migrations`.
- Respeitar sempre o escopo de tenant e preferir soft delete.
- Mensagens de commit descritivas (padrão `feat(web):`, `feat(db):`, `fix:`, `chore:`, `docs:`).
