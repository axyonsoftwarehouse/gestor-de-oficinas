# 6. Problemas, dívidas e riscos

## 6.1 Achados confirmados

| Problema | Categoria | Evidência | Efeito | Estado |
|---|---|---|---|---|
| Rate limit em memória por instância | risco de segurança | `apps/web/src/server/http/rate-limit.ts:8` | Em serverless, cada instância aceita sua própria cota | aberto |
| Login/seed usam credenciais demo visíveis | risco de segurança | `apps/web/src/app/login/page.tsx:13`; `apps/web/scripts/seed-owner.ts:6` | Facilita uso indevido se chegar a ambiente comercial | aberto |
| Fonte remota conflita com a CSP (provável) | bug conhecido | `apps/web/src/app/globals.css:1`; `apps/web/next.config.mjs:22` | Inter pode ser bloqueada em produção e cair para fallback | aberto; confirmar no navegador |
| Sem backup offsite automatizado | risco de segurança | `docs/escopo-projeto-e-roadmap.md` §6.1 | Plano Neon gratuito não oferece backup agendado | aberto, P0 |
| Sem observabilidade e alertas | dívida técnica | `AGENTS.md` §Backlog | Incidentes podem ser percebidos tarde e sem trilha suficiente | aberto |
| Registro manual de modelos com tenant | dívida técnica | `packages/database/src/tenant-extension.ts:11` | Novo modelo pode ficar sem a defesa Prisma; RLS ainda protege | aberto |
| Coluna/modelo legado de autenticação | código morto | `packages/database/prisma/schema.prisma:235` | Aumenta confusão após migração para Better Auth | aberto; confirmar dependências antes de migration |
| Interface sem testes de navegador/componentes | falta de teste | inventário contém somente suítes Node em `apps/web/test/` | Regressões de formulário, cache e navegação podem passar pela CI | aberto |
| Aplicativo mobile é apenas esqueleto | dívida técnica | `apps/mobile/App.tsx:1` | Mecânico não tem fluxo offline | planejado |
| Roadmap textual está defasado quanto ao catálogo de serviços | dívida técnica | `docs/escopo-projeto-e-roadmap.md` §6.2 versus commits `6c0f46a`/`83ac90f` | Próxima pessoa pode priorizar trabalho já concluído | aberto |

Não foram encontrados TODOs/FIXMEs rastreados. A busca por imports reversos aparece nas fichas; pontos de entrada naturalmente sem importador não foram classificados como código morto.

## 6.2 Sugestões para o Caderno do Projeto

Estas propostas não alteram o caderno automaticamente além do texto já aprovado em 09/10/2026:

1. Registrar RLS como garantia principal e a extensão Prisma como defesa em profundidade, com teste obrigatório para novos modelos multi-tenant.
2. Registrar backups offsite e rotação de segredos como pré-condições para operação comercial.
3. Registrar que rate limit em memória é aceitável apenas em desenvolvimento/baixa exposição e precisa de armazenamento compartilhado antes de abertura pública.
4. Registrar o fechamento do catálogo de serviços em 08/10/2026 e atualizar o roadmap textual.
5. Manter abertas as decisões humanas de storage/retenção, billing/planos, provedores de notificação e política de backup.
