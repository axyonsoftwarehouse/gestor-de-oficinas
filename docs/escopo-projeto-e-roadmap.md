# Gestor de Oficinas — Escopo do Projeto e Roadmap

> Documento de handoff para o time de desenvolvimento.
> Cobre a visão de negócio, o escopo funcional, a arquitetura técnica e o que
> falta implementar. Complementa `AGENTS.md` (guia de retomada) e
> `docs/plano-migracao-neon-vercel.md` (execução da migração).

Última atualização: migração concluída e **deploy ao vivo** (Vercel + Neon + Better Auth).

---

## 1. Resumo executivo

**Gestor de Oficinas** é um SaaS **multiempresa** (multi-tenant) para gestão de
**oficinas automotivas**. Cobre o ciclo completo da operação — do cadastro do
cliente e agendamento, passando por inspeção e ordem de serviço, até orçamento,
faturamento, pagamento, estoque e relatórios.

O produto acabou de passar por uma **migração de arquitetura**: saiu de uma API
NestJS separada + web Next.js para um **Next.js full stack** único, hospedado na
**Vercel**, com **PostgreSQL gerenciado no Neon** e autenticação via **Better
Auth**. O objetivo é reduzir custo e complexidade operacional (um deploy, um
banco) sem abrir mão de isolamento de dados por oficina.

Todo o domínio (17 módulos de negócio, 64 rotas de API, 21 telas) já está
portado e validado. O que resta é **finalização de infraestrutura, testes e
features de produto** (mobile, notificações, PDF, billing).

---

## 2. Contexto de negócio

### 2.1 Problema
Oficinas de pequeno e médio porte controlam a operação com papel, planilhas e
sistemas desktop desconectados. Isso gera: orçamentos sem rastreio de aprovação,
estoque sem controle real, faturamento manual sujeito a erro e zero visão
financeira consolidada.

### 2.2 Público-alvo
- Oficinas mecânicas independentes e pequenas redes (2+ filiais).
- Gestores financeiros e proprietários que precisam de visão de caixa e margem.
- Atendentes e mecânicos que precisam de agilidade no balcão e na bancada.

### 2.3 Proposta de valor
- **Uma plataforma** para cadastro, agenda, inspeção, OS, orçamento, fatura,
  pagamento, estoque e compras.
- **Multiempresa real**: várias oficinas (tenants) isoladas no mesmo sistema.
- **Rastreabilidade**: máquina de estados da OS, versionamento de checklists de
  inspeção, estoque por ledger (toda movimentação registrada), soft delete.
- **Financeiro amarrado à operação**: orçamento aprovado → fatura → pagamentos
  (parciais) → status automático (draft/emitida/paga/parcial).
- **Custo de operação baixo**: um deploy (Vercel) + um banco (Neon).

### 2.4 Modelo comercial (a construir)
SaaS por assinatura, com planos e limites por tenant. O schema já prevê `plan`,
`status` e `Trial` no tenant, mas **billing/planos ainda não foram
implementados** (ver seção 6).

### 2.5 Personas e papéis
Cinco papéis de sistema por tenant (templates iniciais):
- **Proprietário** (owner): acesso total.
- **Gerente** (manager): opera e gerencia, sem configurações críticas.
- **Atendente** (advisor): balcão — clientes, veículos, agenda, inspeção, orçamento.
- **Mecânico** (mechanic): suas OS, inspeções e consumo de peças.
- **Financeiro** (accountant): faturamento, pagamentos, despesas, relatórios.

---

## 3. Escopo funcional (o que o produto faz)

### 3.1 Módulos e status

| Módulo | Descrição | Backend | Web | Obs. |
|---|---|---|---|---|
| Autenticação / Tenants | Login, sessão, provisionamento de oficina | OK | OK | Better Auth |
| Filiais (branches) | Unidades da oficina | OK | OK | |
| Clientes (customers) | PF/PJ, contatos, endereço | OK | OK | |
| Veículos | Placa/VIN/chassi, marca/modelo, ano, odômetro | OK | OK | |
| Agendamentos | Agenda por filial/status/tipo | OK | OK | |
| Inspeções | Templates versionados + execução + aprovação | OK | OK | |
| Checklists (templates) | Editor de seções/perguntas/opções | OK | OK | |
| Ordens de Serviço | Máquina de estados, linhas, mecânicos, histórico | OK | OK | |
| Orçamentos | Linhas, desconto/impostos, send/approve/reject | OK | OK | |
| Faturas | Emissão, pagamentos parciais, documento HTML | OK | OK | |
| Pagamentos | Parciais, status automático, métodos | OK | OK | |
| Peças (catálogo) | SKU, custo/venda, estoque mínimo | OK | OK | |
| Estoque | Ledger + saldos + baixa para OS | OK | OK | |
| Compras | Entrada no estoque + despesa automática + cancelamento | OK | OK | |
| Fornecedores | Cadastro | OK | OK | |
| Despesas | Por filial/categoria/período, soma | OK | OK | |
| Relatórios | Financeiro, estoque, OS | OK | OK | |
| Equipe | Membros, papéis, filial | OK | OK | |
| Papéis/Permissões | Matriz de permissões | OK | OK | RBAC |
| **Catálogo de Serviços** | Mão de obra/serviços | **falta** | **falta** | modelo existe |
| **Anexos / Notas** | Arquivos e anotações | **falta** | **falta** | modelos existem |
| **Campos customizados** | Schema dinâmico por tenant | **falta** | **falta** | modelos existem |

### 3.2 Regras de domínio (fechadas)
- **Multi-tenant**: `tenant_id` em toda tabela de negócio; isolamento por RLS.
- **OS unificada**: inspeção/reparo/serviço no mesmo job card, com máquina de
  estados validada no servidor.
- **Inspeção versionada**: publicar gera nova versão; gate de fatura por aprovação.
- **Estoque por ledger**: toda entrada/saída vira `stock_movement`; saldo é derivado.
- **Impostos relacionais por linha** (base, alíquota, valor).
- **Dinheiro** `Decimal(14,2)`, **quantidades** `Decimal(14,3)`.
- **Soft delete** (`deletedAt`) onde aplicável; numeração única por tenant.

---

## 4. Arquitetura técnica

### 4.1 Stack
| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm + Turborepo |
| App (full stack) | **Next.js 15** (App Router) + React 19 |
| Estilo/estado | Tailwind CSS, TanStack React Query, lucide-react |
| API | **Route Handlers** em `apps/web/src/app/api/**` |
| ORM/DB | **Prisma 6** + **PostgreSQL (Neon)** |
| Auth | **Better Auth** (sessão por cookie; tabelas `sessions`/`accounts`) |
| Deploy alvo | **Vercel** (app) + **Neon** (banco) |
| Mobile | Expo (stub — próxima fase: offline com PowerSync) |

### 4.2 Estrutura do monorepo
```
apps/
  web/            # Next full stack (app + API + auth)   <-- produto
  mobile/         # Expo (stub)
packages/
  database/       # schema Prisma, migrations, seed, RLS
  shared/         # catálogo de permissões e templates de papéis
docs/             # documentação
```

### 4.3 Multi-tenant e RLS (ponto central)
- Schema único, `tenant_id` em todas as tabelas de negócio.
- **Row Level Security** no Postgres com `FORCE ROW LEVEL SECURITY`.
- A aplicação abre **uma transação por requisição**, define
  `set_config('app.current_tenant', <id>, true)` e executa o handler dentro dela.
- O papel de banco da aplicação (`app_gestor`) é **NOBYPASSRLS** — a RLS vale de fato.
- Defesa em profundidade: extensão Prisma injeta `tenantId` em creates/listas.
- Tabelas de plataforma (users, tenants, roles, permissions, memberships,
  sessions, accounts) **não** têm RLS (consultadas antes do tenant).

### 4.4 Autenticação e autorização
- **Better Auth**: cadastro/login, sessão em cookie, refresh automático.
- `requireSession()` resolve usuário → vínculo (membership) → oficina ativa →
  **permissões** (resolvidas por requisição, sempre frescas).
- **RBAC**: 21 features × ações = **90 permissões**; 5 templates de papel.
- Rotas protegidas por `runRoute({ permissions: [...] })`.

### 4.5 Convenções de código (seguir à risca)
- Um módulo = `dtos/*`, `services/*.service.ts`, `app/api/**/route.ts`.
- `runRoute` (auth + permissões + transação de tenant + erro) + `parseBody`/
  `parseQuery` (class-validator) + `assertUuid`.
- Todo handler Prisma: `export const runtime = 'nodejs'`.
- Dinheiro/quantidade sempre via `Prisma.Decimal`; nunca float.

---

## 5. Estado atual do repositório

### 5.1 Números
- **65** modelos Prisma.
- **64** rotas de API (Route Handlers).
- **21** telas no web.
- **17** módulos de domínio portados (Nest → Next).
- **90** permissões, **5** papéis template.
- **8** testes automatizados (Vitest: `rls`, `flows`, `auth`).

### 5.2 Qualidade já verificada
- `typecheck` (monorepo) e `next build` verdes.
- **RLS validada de ponta a ponta** no Neon: sem contexto de tenant = 0 linhas;
  com contexto = 1 linha.
- **Suíte Vitest** verde (banco de teste dedicado) e **CI** (GitHub Actions com
  Postgres service).
- **Smoke tests reais no Neon** cobrindo: CRUD dos 17 módulos, criação de usuário
  via Better Auth, inspeção completa, `issueToJob` recalculando a OS, fluxo
  OS → orçamento → fatura → pagamento → documento HTML, compra → estoque →
  despesa → cancelamento, e relatórios.

### 5.3 O que acabou de ser concluído (migração)
- Fase 0: Neon provisionado, migrations aplicadas, RLS + papel `app_gestor`.
- Fase 1: Better Auth (schema, hook de sessão, provisionamento de tenant, seed).
- Fase 2: runtime server (`withTenant`, `runRoute`, erros, validação).
- Fase 3: **portados os 17 módulos** de domínio.
- Fase 4: web readaptado (cookies, `apiFetch`, provider, login, middleware).
- Fase 5: headers de segurança.
- Fase 6: (pendente) PDF headless e storage.
- Fase 7: testes Vitest + CI.
- Fase 8: **`apps/api` removido** (NestJS descomissionado).
- **Deploy ao vivo**: Vercel (região `gru1`) + Neon, login funcionando.
  (`turbo.json` declara as envs em `globalEnv` — sem isso o `envMode: strict`
  do Turbo removia `BETTER_AUTH_SECRET`/URLs do build.)

---

## 6. O que falta implementar

### 6.1 Finalização da migração (técnico)
Concluído: headers de segurança, testes Vitest + CI, config de deploy na Vercel
(região `gru1`, build via Turbo filtrando `@gestor/web`, runbook) e
descomissionamento do `apps/api`.

| Item | Descrição | Prioridade |
|---|---|---|
| PDF headless | Serviço de PDF consumindo `GET /invoices/:id/document` (HTML pronto) | P1 |
| Storage | Anexos/avatares (Vercel Blob / R2 / Neon Object Storage) | P2 |
| Backups | Dump offsite (Neon free não tem backup agendado) | **P0** |
| Rotação de segredos | Rotacionar senha do Neon e do `app_gestor` (circularam em dev) | **P0** |
| Observabilidade | Logs/alertas e runbook de produção | P2 |

### 6.2 Lacunas funcionais (backend + UI)
- **Catálogo de Serviços** (`ServiceCatalog`): modelo existe, mas **sem API e sem
  tela**. Necessário para precificar mão de obra e compor orçamentos/OS.
- **Anexos** (`Attachment`) e **Notas** (`Note`): modelos existem, sem API/UI.
- **Campos customizados** (`CustomFieldset`/`Definition`/`Value`): schema pronto,
  sem API/UI.

### 6.3 Backlog de produto
- **App mobile do mecânico** (Expo + PowerSync, offline-first).
- **Notificações** (e-mail/SMS) e lembretes de manutenção agendados.
- **SaaS**: billing/planos, onboarding self-service, limites por plano.
- **Impressão**: laudo de inspeção/OS e etiquetas QR/barcode.
- **Relatórios**: refino (ex.: "Most Spent", resumo de faturas All/Paid/Unpaid/Overdue).
- **Refino de UI** por tela (abas de settings, etc.).

### 6.4 Dívidas técnicas conhecidas
- Coluna `passwordHash` legada em `users` (substituída pelo `account` do Better Auth).
- `TENANT_MODELS` (extensão Prisma) não inclui `Purchase` (RLS já cobre; corrigir
  a defesa em profundidade).
- Observabilidade/alertas ainda não configurados.

---

## 7. Roadmap sugerido (priorizado)

**Sprint 0 — Hardening (P0)** — concluído
1. Testes Vitest (`rls`, `flows`, `auth`) + CI. ✅
2. Headers de segurança. ✅
3. Deploy (Vercel + Neon) ao vivo. ✅
4. **Pendente:** backups offsite e rotação de segredos.

**Sprint 1 — Fechar o produto**
5. Catálogo de Serviços (API + tela) e uso no orçamento/OS.
6. Anexos e Notas.
7. Serviço de PDF headless.

**Sprint 2 — Crescimento**
8. App mobile (PowerSync offline).
9. Notificações e lembretes.
10. Billing/planos e onboarding.

**Sprint 3 — Extensibilidade**
11. Campos customizados (API + UI).
12. Impressão/QR/barcode.
13. Refino de relatórios e UI.

> Estimativas grosseiras (equipe de 2–3 devs): Sprint 0 ~1 sprint; Sprints 1–3
> ~2–3 sprints cada, dependendo do escopo de mobile e billing.

---

## 8. Setup do time

### 8.1 Pré-requisitos
- Node ≥ 20, pnpm (via corepack).
- Projeto no **Neon** (Postgres) e conta na **Vercel**.

### 8.2 Rodando localmente
```bash
pnpm install
pnpm --filter @gestor/database db:generate
pnpm --filter @gestor/database db:deploy   # aplica migrations (usa DIRECT_URL)
pnpm db:rls                                 # aplica a RLS
pnpm db:seed                                # permissões + tenant demo + owner
pnpm --filter @gestor/web dev               # web/API em http://localhost:3000
```
Login demo: `owner@oficina.local` / `password`.

### 8.3 Variáveis de ambiente (`.env` na raiz, gitignored)
```
DATABASE_URL=<pooler Neon, porta 6543, ?pgbouncer=true&connection_limit=1>
APP_DATABASE_URL=<pooler com o papel app_gestor>
DIRECT_URL=<conexão direta, porta 5432>
BETTER_AUTH_SECRET=<32+ chars>
BETTER_AUTH_URL=http://localhost:3000
```

### 8.4 Convenções de contribuição
- Antes de commitar: `typecheck` de `web` e `database`; `build` quando mexer em rotas.
- Nunca commitar segredos (`.env` é gitignored).
- Migrations versionadas em `packages/database/prisma/migrations`.
- Commits descritivos: `feat(web):`, `feat(db):`, `fix:`, `chore:`, `docs:`.
- Sempre respeitar o escopo de tenant e preferir soft delete.

---

## 9. Anexos

- **Mapa de API**: 64 rotas em `apps/web/src/app/api/**` (auth, register, me,
  health, e os 17 módulos).
- **Catálogo de permissões**: `packages/shared/src/permissions.ts` (21 features).
- **Templates de papéis**: `packages/shared/src/roles.ts`.
- **Schema**: `packages/database/prisma/schema.prisma` (65 modelos).
- **RLS**: `packages/database/prisma/rls.sql`.
- **Migração**: `docs/plano-migracao-neon-vercel.md`.
- **Deploy**: `docs/deploy-vercel.md`.
- **Regras de domínio**: `docs/especificacao-dominio.md`.
- **Dicionário de dados**: `docs/dicionario-dados-referencias.md`.
- **Layout/tema**: `docs/referencia-layout-fintrust.md`.
