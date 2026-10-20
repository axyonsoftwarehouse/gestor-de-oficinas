# 8. Relatório de verificação

> Verificação do mapa de `main@83ac90f`, executada em 09/10/2026; links, citações e contagens reconferidos em 17/10/2026.

## 8.1 Cobertura

| Medida | Resultado |
|---|---:|
| Arquivos rastreados por `git ls-files` | 267 |
| Arquivos de código | 229 |
| Fichas completas | 217 |
| Exceções permitidas | 12 |
| Conta `fichas + exceções` | 217 + 12 = 229 — **fecha** |
| Configuração | 28 |
| Documentação rastreada antes da geração | 9 |
| Ativos binários rastreados | 0 |
| Lock excluído da leitura linha a linha | 1 |

As 12 exceções são exatamente 5 migrations e 7 arquivos de teste. Configurações estáticas foram classificadas fora do conjunto de código, conforme o inventário.

## 8.2 Reconciliação

- Cada um dos 229 arquivos de código está em exatamente um dos 19 módulos: **sim**.
- A soma dos módulos é 229 e bate com o inventário: **sim**.
- Todo arquivo citado nos 18 processos existe no inventário e possui ficha: **sim**.
- Links internos: 554 ocorrências de link Markdown verificadas; 0 falhas.
- Citações por seção: 324 referências `§` resolvidas no arquivo de destino; 0 falhas.
- Dependências internas: todas resolvem para arquivo rastreado.
- Coerência “Depende de”/“Usado por”: construída a partir do mesmo grafo de imports; cada aresta foi materializada nos dois sentidos.

## 8.3 Suficiência

| Pergunta por ficha | Resultado | Lacuna |
|---|---|---|
| O que faz? | preenchido em Propósito e Processo | detalhes internos muito extensos ficam pelos nomes de exports/tabelas |
| De quem depende? | imports internos, env e tabelas listados | carregamentos dinâmicos não literais podem escapar à análise estática |
| Quem usa? | grafo reverso de imports | rotas/páginas são pontos de entrada e podem não ter importador |
| Tem teste? | busca por export, recurso e endpoint nas suítes | cobertura transitiva não equivale a cobertura de linha |
| Tem tela? | rotas cruzadas com chamadas `apiFetch` | chamadas construídas dinamicamente podem exigir inspeção manual |
| Em qual processo entra? | processos e quadro de cada módulo | arquivos de suporte entram indiretamente |

## 8.4 Contagens do documento

| Item | Contagem | Origem |
|---|---:|---|
| Módulos | 19 | arquivos em `docs/mapa/arquivos/` |
| Processos | 18 | seções de `02-processos.md` |
| Funcionalidades | 29 | seções de `03-funcionalidades.md` |
| Rotas físicas | 66 | `git ls-files apps/web/src/app/api/**/route.ts` |
| Operações HTTP | 110 | exports GET/POST/PUT/PATCH/DELETE |
| Páginas | 25 | arquivos `page.tsx` |
| Entidades/modelos | 65 | blocos `model` do schema |
| Enums | 23 | blocos `enum` do schema |
| Arquivos de teste | 7 | inventário |
| Diagramas Mermaid | 40 | blocos `mermaid` |

## 8.5 Mermaid

Foram extraídos **40 blocos Mermaid** (20 `flowchart`, 18 `sequenceDiagram`, 1 `stateDiagram-v2` e 1 `erDiagram`). Foram verificados cercas, fechamento, tipo de diagrama e identificadores; a renderização pela biblioteca Mermaid não foi executada nesta etapa (ver §8.6).

## 8.6 Dúvidas e limites

- A CSP e o `@import` do Google Fonts parecem incompatíveis; é necessária confirmação no navegador de produção.
- Cobertura de teste foi inferida por referência de export/recurso/endpoint, não por relatório de cobertura de linhas.
- Não há teste de navegador ou componente que prove a integração visual das páginas.
- Não foi possível provar por código se a rotação de segredos e o backup offsite já foram executados; são ações operacionais externas.
- Não foram lidos valores de `.env` ou `.env.local`; somente nomes de `.env.example`.

## Anexo A — comandos e contagens

| Comando | Uso | Resultado |
|---|---|---|
| `git ls-files` | universo rastreado | 267 |
| filtro de extensões + exclusão de configs estáticas | código | 229 |
| busca `^model` em `schema.prisma` | modelos | 65 |
| busca `^enum` em `schema.prisma` | enums | 23 |
| busca de exports HTTP nos `route.ts` | operações | 110 |
| busca de `page.tsx` | páginas | 25 |
| análise de imports literais e aliases | dependências e usados por | grafo bidirecional das fichas |
| verificador Markdown | links relativos e citações por seção | 554 links e 324 citações; 0 falhas |
| verificador estrutural Mermaid | cercas, fechamento e tipo de diagrama | 40 blocos; renderização não executada |

## Anexo B — ignorados e motivo

| Grupo | Motivo |
|---|---|
| `.git/` | metadados do repositório |
| `node_modules/` | dependências reinstaláveis; enumeração do Git em Windows encontra caminhos longos |
| `.next/`, `dist/`, `build/`, `out/` | artefatos gerados |
| `.turbo/` | cache de tarefas |
| `.vercel/` | estado local do deploy |
| `.pgtest/` | binários e dados locais do PostgreSQL de teste |
| `coverage/`, `*.tsbuildinfo` | relatórios/cache de compilação |
| `.idea/`, `.vscode/` | preferências de editor |
| `.env`, `.env.local` | segredos; apenas `.env.example` foi lido |
| `pnpm-lock.yaml` | lock rastreado, contado, mas não lido linha a linha |

## Anexo C — índice de rotas

| Método e caminho | Permissão | Tela que usa? | Ficha em |
|---|---|---|---|
| `GET /api/appointments` | appointment.view, appointment.create | `/appointments` | [`apps/web/src/app/api/appointments/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.3 |
| `POST /api/appointments` | appointment.view, appointment.create | `/appointments` | [`apps/web/src/app/api/appointments/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.3 |
| `GET /api/appointments/:id` | appointment.view, appointment.edit, appointment.delete | `/appointments` | [`apps/web/src/app/api/appointments/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.1 |
| `PATCH /api/appointments/:id` | appointment.view, appointment.edit, appointment.delete | `/appointments` | [`apps/web/src/app/api/appointments/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.1 |
| `DELETE /api/appointments/:id` | appointment.view, appointment.edit, appointment.delete | `/appointments` | [`apps/web/src/app/api/appointments/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.1 |
| `PATCH /api/appointments/:id/status` | appointment.edit | `/appointments` | [`apps/web/src/app/api/appointments/[id]/status/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.2 |
| `GET /api/auth/:all*` | pública (auth delegada ao Better Auth no endpoint de auth; registro e health têm controles próprios) | `/login` | [`apps/web/src/app/api/auth/[...all]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.1 |
| `POST /api/auth/:all*` | pública (auth delegada ao Better Auth no endpoint de auth; registro e health têm controles próprios) | `/login` | [`apps/web/src/app/api/auth/[...all]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.1 |
| `GET /api/branches` | branch.view, branch.create | `/branches` | [`apps/web/src/app/api/branches/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.3 |
| `POST /api/branches` | branch.view, branch.create | `/branches` | [`apps/web/src/app/api/branches/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.3 |
| `PATCH /api/branches/:id` | branch.edit, branch.delete | `/branches` | [`apps/web/src/app/api/branches/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.2 |
| `DELETE /api/branches/:id` | branch.edit, branch.delete | `/branches` | [`apps/web/src/app/api/branches/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.2 |
| `GET /api/customers` | customer.view, customer.create | `/customers` | [`apps/web/src/app/api/customers/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.5 |
| `POST /api/customers` | customer.view, customer.create | `/customers` | [`apps/web/src/app/api/customers/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.5 |
| `GET /api/customers/:id` | customer.view, customer.edit, customer.delete | `/customers` | [`apps/web/src/app/api/customers/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.4 |
| `PATCH /api/customers/:id` | customer.view, customer.edit, customer.delete | `/customers` | [`apps/web/src/app/api/customers/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.4 |
| `DELETE /api/customers/:id` | customer.view, customer.edit, customer.delete | `/customers` | [`apps/web/src/app/api/customers/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.4 |
| `GET /api/expenses` | expense.view, expense.create | `/expenses` | [`apps/web/src/app/api/expenses/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.2 |
| `POST /api/expenses` | expense.view, expense.create | `/expenses` | [`apps/web/src/app/api/expenses/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.2 |
| `GET /api/expenses/:id` | expense.view, expense.edit, expense.delete | `/expenses` | [`apps/web/src/app/api/expenses/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.1 |
| `PATCH /api/expenses/:id` | expense.view, expense.edit, expense.delete | `/expenses` | [`apps/web/src/app/api/expenses/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.1 |
| `DELETE /api/expenses/:id` | expense.view, expense.edit, expense.delete | `/expenses` | [`apps/web/src/app/api/expenses/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.1 |
| `GET /api/health` | pública (auth delegada ao Better Auth no endpoint de auth; registro e health têm controles próprios) | não | [`apps/web/src/app/api/health/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.6 |
| `GET /api/inspection-templates` | inspection.view, inspection.create | `/inspection-templates/:id`, `/inspection-templates`, `/inspections` | [`apps/web/src/app/api/inspection-templates/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.6 |
| `POST /api/inspection-templates` | inspection.view, inspection.create | `/inspection-templates/:id`, `/inspection-templates`, `/inspections` | [`apps/web/src/app/api/inspection-templates/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.6 |
| `GET /api/inspection-templates/:id` | inspection.view | `/inspection-templates/:id`, `/inspection-templates`, `/inspections` | [`apps/web/src/app/api/inspection-templates/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.5 |
| `POST /api/inspection-templates/:id/publish` | inspection.edit | `/inspection-templates/:id`, `/inspection-templates`, `/inspections` | [`apps/web/src/app/api/inspection-templates/[id]/publish/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.4 |
| `GET /api/inspections` | inspection.view, inspection.create | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.10 |
| `POST /api/inspections` | inspection.view, inspection.create | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.10 |
| `GET /api/inspections/:id` | inspection.view, inspection.edit | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.9 |
| `PATCH /api/inspections/:id` | inspection.view, inspection.edit | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/[id]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.9 |
| `PUT /api/inspections/:id/answers/:questionId` | inspection.edit | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/[id]/answers/[questionId]/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.7 |
| `POST /api/inspections/:id/complete` | inspection.edit | `/dashboard`, `/inspections/:id`, `/inspections` | [`apps/web/src/app/api/inspections/[id]/complete/route.ts`](arquivos/13-api-agenda-e-inspecoes.md) §13.8 |
| `GET /api/invoices` | invoice.view | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.8 |
| `GET /api/invoices/:id` | invoice.view, invoice.edit | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.6 |
| `PATCH /api/invoices/:id` | invoice.view, invoice.edit | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.6 |
| `POST /api/invoices/:id/cancel` | invoice.edit | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/cancel/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.1 |
| `GET /api/invoices/:id/document` | invoice.view | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/document/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.2 |
| `POST /api/invoices/:id/issue` | invoice.edit | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/issue/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.3 |
| `POST /api/invoices/:id/payments` | payment.create | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/payments/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.5 |
| `DELETE /api/invoices/:id/payments/:paymentId` | payment.delete | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/[id]/payments/[paymentId]/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.4 |
| `POST /api/invoices/from-job/:jobCardId` | invoice.create | `/dashboard`, `/invoices/:id`, `/invoices`, `/quotations/:id` | [`apps/web/src/app/api/invoices/from-job/[jobCardId]/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.7 |
| `GET /api/job-cards` | job_card.view, job_card.create | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.7 |
| `POST /api/job-cards` | job_card.view, job_card.create | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.7 |
| `GET /api/job-cards/:id` | job_card.view, job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.5 |
| `PATCH /api/job-cards/:id` | job_card.view, job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.5 |
| `POST /api/job-cards/:id/lines` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/lines/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.2 |
| `PATCH /api/job-cards/:id/lines/:lineId` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/lines/[lineId]/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.1 |
| `DELETE /api/job-cards/:id/lines/:lineId` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/lines/[lineId]/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.1 |
| `POST /api/job-cards/:id/mechanics` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/mechanics/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.4 |
| `DELETE /api/job-cards/:id/mechanics/:userId` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/mechanics/[userId]/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.3 |
| `POST /api/job-cards/:id/transition` | job_card.edit | `/dashboard`, `/job-cards/:id`, `/job-cards`, `/quotations`, `/stock` | [`apps/web/src/app/api/job-cards/[id]/transition/route.ts`](arquivos/14-api-ordens-de-servico.md) §14.6 |
| `GET /api/me` | sessão válida, sem permissão adicional declarada | `/job-cards/:id`, `/login` | [`apps/web/src/app/api/me/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.7 |
| `GET /api/parts` | part.view, part.create | `/parts`, `/purchases`, `/stock` | [`apps/web/src/app/api/parts/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.2 |
| `POST /api/parts` | part.view, part.create | `/parts`, `/purchases`, `/stock` | [`apps/web/src/app/api/parts/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.2 |
| `GET /api/parts/:id` | part.view, part.edit, part.delete | `/parts`, `/purchases`, `/stock` | [`apps/web/src/app/api/parts/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.1 |
| `PATCH /api/parts/:id` | part.view, part.edit, part.delete | `/parts`, `/purchases`, `/stock` | [`apps/web/src/app/api/parts/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.1 |
| `DELETE /api/parts/:id` | part.view, part.edit, part.delete | `/parts`, `/purchases`, `/stock` | [`apps/web/src/app/api/parts/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.1 |
| `GET /api/purchases` | purchase.view, purchase.create | `/dashboard`, `/purchases` | [`apps/web/src/app/api/purchases/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.5 |
| `POST /api/purchases` | purchase.view, purchase.create | `/dashboard`, `/purchases` | [`apps/web/src/app/api/purchases/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.5 |
| `GET /api/purchases/:id` | purchase.view | `/dashboard`, `/purchases` | [`apps/web/src/app/api/purchases/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.4 |
| `POST /api/purchases/:id/cancel` | purchase.edit | `/dashboard`, `/purchases` | [`apps/web/src/app/api/purchases/[id]/cancel/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.3 |
| `GET /api/quotations` | quotation.view, quotation.create | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/route.ts`](arquivos/17-api-orcamentos.md) §17.8 |
| `POST /api/quotations` | quotation.view, quotation.create | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/route.ts`](arquivos/17-api-orcamentos.md) §17.8 |
| `GET /api/quotations/:id` | quotation.view, quotation.edit, quotation.delete | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/route.ts`](arquivos/17-api-orcamentos.md) §17.6 |
| `PATCH /api/quotations/:id` | quotation.view, quotation.edit, quotation.delete | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/route.ts`](arquivos/17-api-orcamentos.md) §17.6 |
| `DELETE /api/quotations/:id` | quotation.view, quotation.edit, quotation.delete | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/route.ts`](arquivos/17-api-orcamentos.md) §17.6 |
| `POST /api/quotations/:id/approve` | quotation.approve | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/approve/route.ts`](arquivos/17-api-orcamentos.md) §17.1 |
| `POST /api/quotations/:id/convert-to-invoice` | invoice.create | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/convert-to-invoice/route.ts`](arquivos/17-api-orcamentos.md) §17.2 |
| `POST /api/quotations/:id/lines` | quotation.edit | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/lines/route.ts`](arquivos/17-api-orcamentos.md) §17.4 |
| `PATCH /api/quotations/:id/lines/:lineId` | quotation.edit | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/lines/[lineId]/route.ts`](arquivos/17-api-orcamentos.md) §17.3 |
| `DELETE /api/quotations/:id/lines/:lineId` | quotation.edit | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/lines/[lineId]/route.ts`](arquivos/17-api-orcamentos.md) §17.3 |
| `POST /api/quotations/:id/reject` | quotation.approve | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/reject/route.ts`](arquivos/17-api-orcamentos.md) §17.5 |
| `POST /api/quotations/:id/send` | quotation.edit | `/dashboard`, `/quotations/:id`, `/quotations` | [`apps/web/src/app/api/quotations/[id]/send/route.ts`](arquivos/17-api-orcamentos.md) §17.7 |
| `POST /api/register` | pública (auth delegada ao Better Auth no endpoint de auth; registro e health têm controles próprios) | não | [`apps/web/src/app/api/register/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.8 |
| `GET /api/reports/financial` | report.view | `/dashboard` | [`apps/web/src/app/api/reports/financial/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.9 |
| `GET /api/reports/job-cards` | report.view | `/dashboard` | [`apps/web/src/app/api/reports/job-cards/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.10 |
| `GET /api/reports/stock` | report.view | `/dashboard` | [`apps/web/src/app/api/reports/stock/route.ts`](arquivos/18-api-faturas-e-relatorios.md) §18.11 |
| `GET /api/roles` | role.view, role.create | `/roles`, `/team` | [`apps/web/src/app/api/roles/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.11 |
| `POST /api/roles` | role.view, role.create | `/roles`, `/team` | [`apps/web/src/app/api/roles/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.11 |
| `GET /api/roles/:id` | role.view, role.edit, role.delete | `/roles`, `/team` | [`apps/web/src/app/api/roles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.9 |
| `PATCH /api/roles/:id` | role.view, role.edit, role.delete | `/roles`, `/team` | [`apps/web/src/app/api/roles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.9 |
| `DELETE /api/roles/:id` | role.view, role.edit, role.delete | `/roles`, `/team` | [`apps/web/src/app/api/roles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.9 |
| `GET /api/roles/permissions` | role.view | `/roles`, `/team` | [`apps/web/src/app/api/roles/permissions/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.10 |
| `GET /api/services` | service.view, service.create | `/services` | [`apps/web/src/app/api/services/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.4 |
| `POST /api/services` | service.view, service.create | `/services` | [`apps/web/src/app/api/services/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.4 |
| `GET /api/services/:id` | service.view, service.edit, service.delete | `/services` | [`apps/web/src/app/api/services/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.3 |
| `PATCH /api/services/:id` | service.view, service.edit, service.delete | `/services` | [`apps/web/src/app/api/services/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.3 |
| `DELETE /api/services/:id` | service.view, service.edit, service.delete | `/services` | [`apps/web/src/app/api/services/[id]/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.3 |
| `GET /api/stock/balances` | stock.view | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/balances/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.5 |
| `POST /api/stock/issues` | stock.create | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/issues/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.6 |
| `GET /api/stock/locations` | stock.view, stock.create | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/locations/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.7 |
| `POST /api/stock/locations` | stock.view, stock.create | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/locations/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.7 |
| `GET /api/stock/movements` | stock.view, stock.create | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/movements/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.8 |
| `POST /api/stock/movements` | stock.view, stock.create | `/dashboard`, `/purchases`, `/stock` | [`apps/web/src/app/api/stock/movements/route.ts`](arquivos/15-api-catalogos-e-estoque.md) §15.8 |
| `GET /api/suppliers` | supplier.view, supplier.create | `/purchases`, `/suppliers` | [`apps/web/src/app/api/suppliers/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.7 |
| `POST /api/suppliers` | supplier.view, supplier.create | `/purchases`, `/suppliers` | [`apps/web/src/app/api/suppliers/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.7 |
| `GET /api/suppliers/:id` | supplier.view, supplier.edit, supplier.delete | `/purchases`, `/suppliers` | [`apps/web/src/app/api/suppliers/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.6 |
| `PATCH /api/suppliers/:id` | supplier.view, supplier.edit, supplier.delete | `/purchases`, `/suppliers` | [`apps/web/src/app/api/suppliers/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.6 |
| `DELETE /api/suppliers/:id` | supplier.view, supplier.edit, supplier.delete | `/purchases`, `/suppliers` | [`apps/web/src/app/api/suppliers/[id]/route.ts`](arquivos/16-api-compras-e-despesas.md) §16.6 |
| `GET /api/users` | user.view, user.create | `/job-cards/:id`, `/team` | [`apps/web/src/app/api/users/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.13 |
| `POST /api/users` | user.view, user.create | `/job-cards/:id`, `/team` | [`apps/web/src/app/api/users/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.13 |
| `GET /api/users/:id` | user.view, user.edit, user.delete | `/job-cards/:id`, `/team` | [`apps/web/src/app/api/users/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.12 |
| `PATCH /api/users/:id` | user.view, user.edit, user.delete | `/job-cards/:id`, `/team` | [`apps/web/src/app/api/users/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.12 |
| `DELETE /api/users/:id` | user.view, user.edit, user.delete | `/job-cards/:id`, `/team` | [`apps/web/src/app/api/users/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.12 |
| `GET /api/vehicles` | vehicle.view, vehicle.create | `/vehicles` | [`apps/web/src/app/api/vehicles/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.15 |
| `POST /api/vehicles` | vehicle.view, vehicle.create | `/vehicles` | [`apps/web/src/app/api/vehicles/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.15 |
| `GET /api/vehicles/:id` | vehicle.view, vehicle.edit, vehicle.delete | `/vehicles` | [`apps/web/src/app/api/vehicles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.14 |
| `PATCH /api/vehicles/:id` | vehicle.view, vehicle.edit, vehicle.delete | `/vehicles` | [`apps/web/src/app/api/vehicles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.14 |
| `DELETE /api/vehicles/:id` | vehicle.view, vehicle.edit, vehicle.delete | `/vehicles` | [`apps/web/src/app/api/vehicles/[id]/route.ts`](arquivos/12-api-acesso-e-cadastros.md) §12.14 |
