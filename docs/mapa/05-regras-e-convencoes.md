# 5. Regras e convenções

## 5.1 Regras transcritas

### Regras de negócio

- Toda tabela de negócio deve respeitar o tenant; RLS é a garantia principal (`AGENTS.md` e `docs/escopo-projeto-e-roadmap.md`).
- A OS é unificada e segue máquina de estados validada no servidor (`docs/especificacao-dominio.md`).
- Inspeção é versionada e sua aprovação pode bloquear faturamento (`docs/especificacao-dominio.md`).
- Estoque é ledger: entradas e saídas viram movimentos; saldo é derivado (`AGENTS.md`).
- Dinheiro usa `Decimal(14,2)` e quantidades `Decimal(14,3)` (`AGENTS.md`).

### Regras técnicas

- Node ≥20, pnpm e Turborepo; o app/API é Next.js full stack (`package.json`, `AGENTS.md`).
- Rotas Prisma usam runtime Node.js e passam por `runRoute` quando protegidas (`AGENTS.md`).
- O runtime usa `APP_DATABASE_URL` com papel NOBYPASSRLS; migrations usam conexão direta (`AGENTS.md`, `.github/workflows/migrate.yml`).
- CI executa geração Prisma, typecheck, build web e testes em PostgreSQL 16 (`.github/workflows/ci.yml`).
- Antes de commit: typecheck; build para rotas; testes para fluxos (`AGENTS.md`).
- Commits seguem prefixos `feat`, `fix`, `chore` e `docs` (`AGENTS.md`).

## 5.2 Regras inferidas do código

- **Inferida — rotas finas:** os handlers validam entrada/permissão e delegam ao service; padrão repetido nos 66 arquivos de rota.
- **Inferida — erros centralizados:** services lançam erros tipados e `handleError` converte para JSON; aparece em todas as áreas do servidor.
- **Inferida — listas paginadas:** filtros herdam `PaginationDto` e retornam `items`, `total`, `page`, `pageSize`, `totalPages`.
- **Inferida — defesa em profundidade:** RLS é combinada com contexto assíncrono e extensão Prisma de tenant.
- **Inferida — telas orientadas a cache:** páginas usam React Query e invalidam chaves depois de mutações.
- **Inferida — documentos numerados:** OS, orçamento, fatura e compra reservam sequência dentro da transação.
- **Inferida — testes integrados:** as suítes exercitam services/rotas contra PostgreSQL real em vez de mocks de persistência.

## 5.3 Regras sugeridas

1. **Sugestão — todo recurso com tenant deve ter um teste automático de cobertura da extensão e da RLS.** Evita depender de uma lista manual incompleta. Evidência: `packages/database/src/tenant-extension.ts:11`.
2. **Sugestão — rate limiting de produção deve usar estado compartilhado.** Evita multiplicar o limite por instância serverless. Evidência: `apps/web/src/server/http/rate-limit.ts:8`.
3. **Sugestão — credenciais demo não podem aparecer nem ser impressas em produção.** Evita exposição acidental. Evidências: `apps/web/src/app/login/page.tsx:13` e `apps/web/scripts/seed-owner.ts:6`.
4. **Sugestão — fontes de produção devem ser locais ou permitidas explicitamente na CSP.** Evita bloqueio e mudança visual. Evidências: `apps/web/src/app/globals.css:1` e `apps/web/next.config.mjs:22`.
5. **Sugestão — toda página crítica deve ter ao menos um teste de navegador.** Evita que fluxos funcionem no service, mas quebrem na composição da interface. Evidência: não há arquivo de teste de componente/E2E entre os 267 rastreados.
6. **Sugestão — documentos de roadmap precisam ser atualizados no mesmo commit da entrega.** Evita manter lacunas já resolvidas como pendentes. Evidência: `docs/escopo-projeto-e-roadmap.md` ainda diz que o catálogo de serviços não tem API/tela, mas os commits `6c0f46a` e `83ac90f` o implementaram.
