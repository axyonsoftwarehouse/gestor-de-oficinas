# Deploy na Vercel (app) + Neon (banco)

> Runbook de deploy do Gestor de Oficinas.
> App: Next full stack em `apps/web`. Banco: PostgreSQL no Neon.

## 1. Pré-requisitos
- Repositório no GitHub (este).
- Conta na Vercel (o **Hobby** é só para uso não-comercial; para SaaS, **Pro**).
- Projeto no Neon (região `sa-east-1` → Vercel `gru1`).

## 2. Criar o projeto na Vercel
1. **Add New → Project → Import Git Repository** (selecione o repo).
2. Em **Root Directory**, selecione **`apps/web`**.
3. **Framework Preset**: `Next.js` (detectado).
4. Build/Install: deixe a Vercel detectar o monorepo (Turbo). O `apps/web/vercel.json`
   fixa o `buildCommand` e a região.

## 3. Variáveis de ambiente (Production e Preview)
| Variável | Valor |
|---|---|
| `DATABASE_URL` | Pooler do Neon (porta 6543) + `?sslmode=require&pgbouncer=true&connection_limit=1` |
| `APP_DATABASE_URL` | Pooler do Neon com o papel **`app_gestor`** (mesmos flags) |
| `DIRECT_URL` | Conexão **direta** do Neon (porta 5432, `sslmode=require`) |
| `BETTER_AUTH_SECRET` | Segredo (32+ chars, alto entropia) |
| `BETTER_AUTH_URL` | URL pública de produção (ex.: `https://app.suaoficina.com`) |
| `NEXT_PUBLIC_API_URL` | `/api` (mesma origem) |

> Importante: em produção a aplicação **deve** conectar como `app_gestor`
> (NOBYPASSRLS). Nunca use o owner do Neon no runtime — ele fura a RLS.

## 4. Migrations
Não rode migrations no build (evita corrida/estado parcial). Opções:
- **Manual**: aplique apontando `DIRECT_URL` para o banco de produção:
  `pnpm --filter @gestor/database db:deploy:direct`
- **GitHub Action**: `.github/workflows/migrate.yml` (disparo manual) usa o secret
  `PROD_DIRECT_URL` (conexão direta do Neon).

Após aplicar migrations em um banco novo, rode também a RLS e o papel:
`pnpm --filter @gestor/database db:app-role:direct` e `... db:rls:direct`
(com `DIRECT_URL`/`DATABASE_URL` apontando para produção).

## 5. Região
As funções rodam em **`gru1` (São Paulo)** — próxima do Neon `sa-east-1`
(configurado em `apps/web/vercel.json`). Sem isso, as funções ficariam em
`iad1` (EUA) e cada query pagaria ~90–100 ms de latência.

> Hobby permite apenas **1 região**; Pro permite até 5.

## 6. Domínio e cookies
- Configure o domínio no projeto da Vercel.
- Ajuste `BETTER_AUTH_URL` para o domínio final (usado pelo Better Auth para
  cookies/redirects). Em HTTPS, os cookies saem `secure` automaticamente.

## 7. Verificação pós-deploy
- `GET /api/health` → `{ "status": "ok", "db": "up" }`.
- Login com o owner provisionado.

## 8. Observações
- **Backups**: o Neon free não tem backup agendado. Rode o workflow
  `.github/workflows/backup.yml` e siga o runbook
  [`docs/backups-e-rotacao.md`](backups-e-rotacao.md). A configuração do bucket e
  dos secrets ainda é uma pendência operacional.
- **Segredos**: rotacione a senha do Neon e a do papel `app_gestor` antes de
  produção. O procedimento e o gerador estão em
  [`docs/backups-e-rotacao.md`](backups-e-rotacao.md) §7.
- **Storage** (anexos/avatares): a definir (Vercel Blob / R2 / Neon Object Storage).
- **PDF**: o endpoint `GET /api/invoices/:id/document` já devolve HTML; o serviço
  de PDF headless (Playwright) consome esse HTML fora da Vercel (backlog).
- **Turborepo env**: `NEXT_PUBLIC_*` são inferidos no cache; se passar a inlined
  outras variáveis de build, declare em `turbo.json`.
