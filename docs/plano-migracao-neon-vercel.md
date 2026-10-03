# Plano de migração — NestJS + Next → Next.js full stack (Vercel + Neon + Better Auth)

> Objetivo: eliminar a API NestJS e o Postgres em Docker, deixando **um deploy na
> Vercel** + **um Postgres gerenciado (Neon)** + **Better Auth** rodando no próprio
> Next. Migração completa, projeto ainda não está em uso.

## 0. Decisão arquitetural (resumo)

| Camada | Hoje | Depois |
|---|---|---|
| HTTP | NestJS controllers (19) + 106 handlers | Next Route Handlers `app/api/**/route.ts` |
| Domínio | Nest services injetáveis | Classes puras (`src/server/services`) |
| Auth | JWT + refresh próprios (`refresh_tokens`) | **Better Auth** (sessão em cookie) |
| Isolamento | RLS via `SET LOCAL app.current_tenant` | **mesma RLS**, via `withTenant()` |
| ORM | Prisma 6 | Prisma 6 — inalterado |
| Deploy | API VPS + Web Vercel | **1 projeto Vercel** + Neon |
| PDF | (backlog) Playwright | `@react-pdf/renderer` |
| Storage | S3 | Vercel Blob / Neon Object Storage (opcional) |

**Princípio-chave:** mantém-se a RLS com `app.current_tenant` (Postgres puro). A
identidade/sessão passa a ser Better Auth com as tabelas `sessions`/`accounts`/`verifications`.

### Por que não Supabase / Cloudflare
- **Supabase free:** só 2 projetos e auth acoplada ao projeto.
- **Cloudflare Workers:** não roda NestJS; não tem Postgres (D1 é SQLite sem RLS);
  free com 10 ms de CPU/request.
- **Neon:** Postgres gerenciado, free com 100 projetos, pooling/TLS inclusos, e
  **Managed Better Auth**. A conta que limita é **CU-hours por projeto** (100/mês no
  free), não a quantidade de projetos. Scale-to-zero automático após 5 min ocioso
  (não dá para agendar suspensão; é automático e reacorda na próxima query).

## 1. O que fica intocado
- `packages/shared` (permissões, roles).
- `packages/database` (schema e `tenant-extension`/`tenant-context`).
- Toda a UI (`apps/web/src/app/**`, `components`).

## 2. Mapa de conversão Nest → Next
```
apps/api/.../customers.controller.ts
  @Controller('customers') + @Get/@Post/@Get(':id')/@Patch(':id')/@Delete(':id')
        ↓
apps/web/src/app/api/customers/route.ts          (GET, POST)
apps/web/src/app/api/customers/[id]/route.ts     (GET, PATCH, DELETE)
```
- `*.service.ts` → `apps/web/src/server/services/*.service.ts`.
- `PrismaService` → `apps/web/src/server/db/prisma.ts` (singleton + `getDb()`).
- `TenantContextInterceptor` → `withTenant()`.
- Guards + `@Public`/`@RequirePermissions` → `withRoute({ permissions })` + `middleware.ts`.
- `AllExceptionsFilter` + `ValidationPipe` → `handleError()` + `parseBody()`.

## 3. Autenticação (Better Auth)
- Tabelas gerenciadas pelo Better Auth: `users` (estendida), `sessions`, `accounts`,
  `verifications`. `passwordHash` legado fica ocioso (remover na Fase 8).
- `User.id` = UUID gerado pelo Prisma (`generateId: false`).
- `image` mapeado para `avatarUrl`; `emailVerified` adicionado.
- Tenant ativo = `users.defaultTenantId` (se houver vínculo) ou o vínculo ativo mais antigo.
- **Permissões resolvidas por requisição** (não no token), sempre frescas.

Fluxos (`apps/web/src/server/auth/`):
- handler: `app/api/auth/[...all]/route.ts` (`toNextJsHandler`).
- `requireSession()` → `auth.api.getSession` + membership/permissões.
- client (web): `better-auth/react` (Fase 4).

## 4. RLS e tenant no serverless (Neon)
- Runtime conecta pelo **pooler transaction mode** (`?pgbouncer=true&connection_limit=1`);
  migrations pela conexão **direta** (`DIRECT_URL`).
- `withTenant` abre transação, faz `set_config('app.current_tenant', ..., true)` e roda o serviço.
- RLS aplicada com `FORCE ROW LEVEL SECURITY`; o papel da aplicação não deve ter `BYPASSRLS`.
- Todo handler Prisma: `export const runtime = 'nodejs'`.

## 5. Estrutura alvo (apps/web)
```
src/
  app/api/**/route.ts
  app/api/auth/[...all]/route.ts
  server/{env,db/**,auth/**,http/**,services/**}
  middleware.ts
```

## 6. Fases
- **Fase 0 — Provisionamento:** projeto Neon, `DIRECT_URL`, migrations, RLS.
- **Fase 1 — Auth:** Better Auth (feito), provisionamento de tenant (register) e seed.
- **Fase 2 — Runtime server:** prisma/withTenant/withRoute/parseBody/handleError (feito).
- **Fase 3 — Portar módulos:** branches → customers/vehicles/suppliers/parts/... → invoices/job-cards.
- **Fase 4 — Web rewiring:** trocar `api.ts`/`session.ts`/`auth-provider` por Better Auth.
- **Fase 5 — Cross-cutting:** health, headers.
- **Fase 6 — PDF/Storage.**
- **Fase 7 — Testes/CI:** `postinstall: prisma generate`; migrations no CI.
- **Fase 8 — Descomissionar `apps/api`.**

## 7. Env
```
BETTER_AUTH_SECRET="openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://...-pooler...:6543/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...:5432/neondb?sslmode=require"
```

## 8. Riscos
1. Sem `pgbouncer=true&connection_limit=1` a Vercel esgota conexões.
2. Timeout de função: manter transações curtas (Vercel Hobby 10 s).
3. Prisma sempre em runtime `nodejs`; middleware Edge não toca Prisma.
4. `BYPASSRLS` nunca no papel da aplicação.
5. Neon free: sem backup agendado → dump offsite próprio.
6. Auth: usuário precisa ser criado via Better Auth (credential account), não só inserido.

## 9. Critérios de conclusão
- Zero chamadas ao `apps/api`; `/api/**` no mesmo domínio.
- RLS/RBAC revalidados por `rls` e `flows`.
- Login/logout via Better Auth com cookies.
- Deploy único na Vercel + Neon.
- `typecheck` web/shared verdes; e2e portado.

## 10. Status da execução
- [x] Plano salvo.
- [x] **Fase 1 (schema)**: `emailVerified`, `sessions`, `accounts`, `verifications` + migration `20261003130000_better_auth`.
- [x] **Fase 1 (auth)**: `server/auth/auth.ts`, `app/api/auth/[...all]/route.ts`, `require-session.ts`, `middleware.ts`.
- [x] **Fase 2 (runtime)**: `server/db/**` e `server/http/**`.
- [x] `typecheck` do web verde (`better-auth@1.7.7`).
- [x] **Fase 0**: projeto Neon criado; 4 migrations aplicadas (`db:deploy`); papel `app_gestor` (NOBYPASSRLS) + RLS (`rls.sql` reprodutível via `db:rls`); **RLS validada** (sem contexto = 0 linhas, com contexto = 1).
- [x] `.env` com pooled/direct URLs do Neon + `BETTER_AUTH_SECRET`; scripts de DB passam a carregar o `.env` raiz via `dotenv-cli`.
- [x] **Fase 1 (resto)**: provisionamento (`POST /api/register` + `server/auth/provision.ts`) e seed via Better Auth (`db:seed` cria domínio; `db:seed:owner` cria o owner). **Validado**: login do owner + 90 permissões resolvidas.
- [x] **Fase 3 (padrão)**: slice `branches` completo no server (`services/branches.service.ts`, `dtos/*`, `/api/branches`, `/api/branches/[id]`, wrapper `runRoute`), validado (CRUD + isolamento RLS).
- [x] **Fase 3 (lote 1)**: `customers`, `vehicles`, `suppliers`, `parts`, `expenses`, `appointments` (DTOs + services + rotas). Smoke test no Neon OK.
- [x] **Fase 3 (lote 2)**: `users` (criação via Better Auth), `roles`, `inspection-templates`, `inspections`, `stock` (+ serviços comuns `number-sequence`, `line-calculator` e `job-cards.service` como dependência). Smoke test no Neon OK (inclui `issueToJob` recalculando a OS).
- [ ] **Fase 3 (resto)**: faltam `job-cards` (rotas), `purchases`, `quotations`, `invoices`, `reports` (12/19 controllers prontos).
- [x] **Fase 4**: rewiring do web — `lib/auth-client.ts`, `apiFetch` com `credentials: 'include'` e base `/api`, `auth-provider` via `authClient.useSession`, `GET /api/me`, middleware ativo. Validado: login → cookie → `getSession`; `next build` OK (rotas tipadas).
- [ ] Fases 5–8.
