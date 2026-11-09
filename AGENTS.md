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
pnpm db:seed:vehicle-catalog                  # catálogo de marcas/modelos nas oficinas existentes
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

Backup offsite (o Neon free não tem backup agendado): `scripts/backup-db.mjs` +
`.github/workflows/backup.yml`; configuração, restauração e rotação de segredos
em `docs/backups-e-rotacao.md`. O padrão free tier é 3 diários + 1 mensal; a cota
de 10 GB do R2 é compartilhada entre projetos (ver §2.1 do runbook).

```
pnpm db:backup                                  # dump cifrado em .backups/ (lê .env)
pnpm db:backup:verify .backups/arquivo.dump.enc # checksum + TOC do dump
pnpm db:restore .backups/arquivo.dump.enc --target "postgresql://..." --yes
```

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
ledger + despesa automática), relatórios, usuários, papéis/permissões e catálogo
de serviços. `GET /api/health`.

**App da oficina (PWA)** (`apps/web/src/app/(mobile)`): `/m/hoje`,
`/m/os/nova`, `/m/os/[id]`, `/m/caixa` e `/m/caixa/[id]`; manifest em
`app/manifest.ts`, detecção de celular no `middleware.ts` e plano `essencial`
que recorta o menu. Ver `docs/app-mobile-pwa.md`.

**Link público do orçamento**: `/o/[token]` com token assinado (HMAC, 7 dias),
aprovação/recusa sem login, `AuditLog` da decisão e botão de envio por WhatsApp
no app. Rotas em `app/api/public/**` e `POST /api/quotations/[id]/public-link`.

**Catálogo de veículos**: marcas/modelos por oficina (`vehicle_brands` /
`vehicle_models`), provisionados com o catálogo padrão de
`packages/shared/src/vehicle-catalog.ts` e editáveis por
`/api/vehicle-catalog/**`. Selects encadeados no cadastro do back-office e no
app. `pnpm db:seed:vehicle-catalog` preenche oficinas antigas.

**Qualidade**: `typecheck` e `next build` verdes; **RLS validada** no Neon;
testes Vitest (`rls`, `flows`, `auth`).

**Deploy**: **ao vivo** em https://gestor-de-oficinas.vercel.app (Vercel, região
`gru1`) + Neon. Repositório em https://github.com/axyonsoftwarehouse/gestor-de-oficinas
(Vercel conectada a ele). Ver `docs/deploy-vercel.md` e `.github/workflows/{ci,migrate}.yml`.
Obs.: `turbo.json` declara as envs em `globalEnv` (o `envMode: strict` do Turbo
remove do build qualquer variável não declarada).

## Backlog / próximos passos
1. **Offline do PWA** (fila local de mutações) e, só depois de validado, o app
   **Expo + PowerSync** (offline real + inspeção com câmera).
2. **Serviço de PDF headless** (Playwright) consumindo `GET /api/invoices/:id/document`.
3. **Anexos/notas** e **campos customizados** (schema existe, faltam API + UI).
4. **Refino de UI** por tela (resumo de faturas, abas de settings, "Most Spent").
5. **SaaS**: billing/planos, onboarding self-service, limites por plano.
6. **Notificações** (e-mail/SMS) e lembretes de manutenção (agendados).
7. **Impressão** de laudo/anexos e etiquetas QR/barcode.
8. **Placa como serviço**: preencher marca/modelo/ano automaticamente (hoje é
   seleção manual no catálogo).
9. **Backups offsite e rotação de segredos**: automação e runbook preparados;
   falta configurar bucket/secrets, rodar o primeiro backup e o drill de
   restauração (`docs/backups-e-rotacao.md`).
10. Observabilidade/alertas e runbook de produção.

## Decisões de arquitetura (fechadas)
Stack Node/TS; **Next.js full stack** (Route Handlers) + **Vercel**; Postgres
(Neon) + Prisma; multi-tenant schema único + `tenant_id` + **RLS**; **Better Auth**;
**PowerSync** para offline; **OS unificada**; inspeção **versionada** com gate de
fatura por aprovação; impostos relacionais por linha; **estoque por ledger**; RBAC
normalizado; PDF via serviço headless; monorepo pnpm+Turborepo; **PWA mobile
primeiro** (`/m`) e Expo/PowerSync depois de validado; **plano `essencial`**
recorta o menu (não as permissões).

## Documentos de referência
- `docs/escopo-projeto-e-roadmap.md` — escopo (negócio + técnico) e roadmap.
- `docs/app-mobile-pwa.md` — app da oficina (PWA), modo Essencial e próximos passos.
- `docs/plano-migracao-neon-vercel.md` — execução da migração.
- `docs/deploy-vercel.md` — runbook de deploy.
- `docs/backups-e-rotacao.md` — backup offsite, restauração e rotação de segredos.
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
