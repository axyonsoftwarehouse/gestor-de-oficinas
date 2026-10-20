# 3. Estado das funcionalidades

| Funcionalidade | Status | Como sei | Falta |
|---|---|---|---|
| Autenticação e sessão | **completa** | login + Better Auth + API | — |
| Provisionamento de tenant | **só API** | registro público e criação transacional | não há tela de onboarding |
| Filiais | **completa** | tela + API + Branch | — |
| Clientes | **completa** | tela + API + Customer | — |
| Veículos | **completa** | tela + API + Vehicle | — |
| Agendamentos | **completa** | tela + API + Appointment | — |
| Templates de inspeção | **completa** | lista/detalhe + API + modelos versionados | — |
| Execução de inspeção | **completa** | lista/detalhe + respostas/conclusão + banco | impressão/anexos ainda não existem |
| Ordens de serviço | **completa** | lista/detalhe + itens/mecânicos/transições + banco | — |
| Orçamentos | **completa** | lista/detalhe + itens/estados/conversão + banco | — |
| Faturas e pagamentos | **completa** | lista/detalhe + emissão/pagamento/cancelamento + banco | PDF binário ainda não existe |
| Documento HTML de fatura | **só API** | endpoint document gera HTML | serviço headless para PDF |
| Peças | **completa** | tela + API + Part | — |
| Catálogo de serviços | **completa** | tela + API + ServiceCatalog + seletores | — |
| Fornecedores | **completa** | tela + API + Supplier | — |
| Estoque | **completa** | tela + movimentos/saldos/baixa para OS + ledger | — |
| Compras | **completa** | tela + recebimento/cancelamento + estoque/despesa | — |
| Despesas | **completa** | tela + API + Expense | — |
| Equipe | **completa** | tela + API + usuário/vínculo | — |
| Papéis e permissões | **completa** | tela + API + RBAC | — |
| Relatórios | **completa** | dashboard + três APIs de agregação | refinos visuais/indicadores permanecem no backlog |
| Anexos | **só banco** | modelos no schema | API, storage e telas |
| Notas | **só banco** | modelo no schema | API e telas |
| Campos customizados | **só banco** | modelos no schema | API e telas |
| Aplicativo mobile offline | **planejada** | App Expo é stub | PowerSync, telas e fluxos |
| Notificações e lembretes | **planejada** | sem worker/provedor | provedor, agendamento e preferências |
| Billing e planos SaaS | **planejada** | sem modelo comercial implementado | planos, limites, cobrança e onboarding |
| Portal do cliente | **planejada** | decisão registrada, sem código | token, aprovação, acompanhamento e assinatura |
| Backups offsite e observabilidade | **planejada** | runbook cita lacuna | automação, retenção, logs e alertas |

## 3.1 Autenticação e sessão

**Status:** completa. login + Better Auth + API. **Falta:** —.

**Rotas representativas:** `GET/POST /api/auth/:all*`.

## 3.2 Provisionamento de tenant

**Status:** só API. registro público e criação transacional. **Falta:** não há tela de onboarding.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.3 Filiais

**Status:** completa. tela + API + Branch. **Falta:** —.

**Telas:** `/branches`.

**Rotas representativas:** `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`.

## 3.4 Clientes

**Status:** completa. tela + API + Customer. **Falta:** —.

**Telas:** `/customers`.

**Rotas representativas:** `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.5 Veículos

**Status:** completa. tela + API + Vehicle. **Falta:** —.

**Telas:** `/vehicles`.

**Rotas representativas:** `GET/PATCH/DELETE /api/vehicles/:id`, `GET/POST /api/vehicles`.

## 3.6 Agendamentos

**Status:** completa. tela + API + Appointment. **Falta:** —.

**Telas:** `/appointments`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`.

## 3.7 Templates de inspeção

**Status:** completa. lista/detalhe + API + modelos versionados. **Falta:** —.

**Telas:** `/inspection-templates/:id`, `/inspection-templates`.

**Rotas representativas:** `POST /api/inspection-templates/:id/publish`, `GET /api/inspection-templates/:id`, `GET/POST /api/inspection-templates`.

## 3.8 Execução de inspeção

**Status:** completa. lista/detalhe + respostas/conclusão + banco. **Falta:** impressão/anexos ainda não existem.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.9 Ordens de serviço

**Status:** completa. lista/detalhe + itens/mecânicos/transições + banco. **Falta:** —.

**Telas:** `/job-cards/:id`, `/job-cards`.

**Rotas representativas:** `PATCH/DELETE /api/job-cards/:id/lines/:lineId`, `POST /api/job-cards/:id/lines`, `DELETE /api/job-cards/:id/mechanics/:userId`, `POST /api/job-cards/:id/mechanics`, `GET/PATCH /api/job-cards/:id`, `POST /api/job-cards/:id/transition`, `GET/POST /api/job-cards`.

## 3.10 Orçamentos

**Status:** completa. lista/detalhe + itens/estados/conversão + banco. **Falta:** —.

**Telas:** `/quotations/:id`, `/quotations`.

**Rotas representativas:** `POST /api/quotations/:id/approve`, `POST /api/quotations/:id/convert-to-invoice`, `PATCH/DELETE /api/quotations/:id/lines/:lineId`, `POST /api/quotations/:id/lines`, `POST /api/quotations/:id/reject`, `GET/PATCH/DELETE /api/quotations/:id`, `POST /api/quotations/:id/send`, `GET/POST /api/quotations`.

## 3.11 Faturas e pagamentos

**Status:** completa. lista/detalhe + emissão/pagamento/cancelamento + banco. **Falta:** PDF binário ainda não existe.

**Telas:** `/invoices/:id`, `/invoices`.

**Rotas representativas:** `POST /api/invoices/:id/cancel`, `GET /api/invoices/:id/document`, `POST /api/invoices/:id/issue`, `DELETE /api/invoices/:id/payments/:paymentId`, `POST /api/invoices/:id/payments`, `GET/PATCH /api/invoices/:id`, `POST /api/invoices/from-job/:jobCardId`, `GET /api/invoices`.

## 3.12 Documento HTML de fatura

**Status:** só API. endpoint document gera HTML. **Falta:** serviço headless para PDF.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.13 Peças

**Status:** completa. tela + API + Part. **Falta:** —.

**Telas:** `/parts`.

**Rotas representativas:** `GET/PATCH/DELETE /api/parts/:id`, `GET/POST /api/parts`.

## 3.14 Catálogo de serviços

**Status:** completa. tela + API + ServiceCatalog + seletores. **Falta:** —.

**Telas:** `/services`.

**Rotas representativas:** `GET/PATCH/DELETE /api/services/:id`, `GET/POST /api/services`.

## 3.15 Fornecedores

**Status:** completa. tela + API + Supplier. **Falta:** —.

**Telas:** `/suppliers`.

**Rotas representativas:** `GET/PATCH/DELETE /api/suppliers/:id`, `GET/POST /api/suppliers`.

## 3.16 Estoque

**Status:** completa. tela + movimentos/saldos/baixa para OS + ledger. **Falta:** —.

**Telas:** `/stock`.

**Rotas representativas:** `GET /api/stock/balances`, `POST /api/stock/issues`, `GET/POST /api/stock/locations`, `GET/POST /api/stock/movements`.

## 3.17 Compras

**Status:** completa. tela + recebimento/cancelamento + estoque/despesa. **Falta:** —.

**Telas:** `/purchases`.

**Rotas representativas:** `POST /api/purchases/:id/cancel`, `GET /api/purchases/:id`, `GET/POST /api/purchases`.

## 3.18 Despesas

**Status:** completa. tela + API + Expense. **Falta:** —.

**Telas:** `/expenses`.

**Rotas representativas:** `GET/PATCH/DELETE /api/expenses/:id`, `GET/POST /api/expenses`.

## 3.19 Equipe

**Status:** completa. tela + API + usuário/vínculo. **Falta:** —.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.20 Papéis e permissões

**Status:** completa. tela + API + RBAC. **Falta:** —.

**Telas:** `/roles`.

**Rotas representativas:** `GET/PATCH/DELETE /api/roles/:id`, `GET /api/roles/permissions`, `GET/POST /api/roles`.

## 3.21 Relatórios

**Status:** completa. dashboard + três APIs de agregação. **Falta:** refinos visuais/indicadores permanecem no backlog.

**Rotas representativas:** `GET /api/reports/financial`, `GET /api/reports/job-cards`, `GET /api/reports/stock`.

## 3.22 Anexos

**Status:** só banco. modelos no schema. **Falta:** API, storage e telas.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.23 Notas

**Status:** só banco. modelo no schema. **Falta:** API e telas.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.24 Campos customizados

**Status:** só banco. modelos no schema. **Falta:** API e telas.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.25 Aplicativo mobile offline

**Status:** planejada. App Expo é stub. **Falta:** PowerSync, telas e fluxos.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.26 Notificações e lembretes

**Status:** planejada. sem worker/provedor. **Falta:** provedor, agendamento e preferências.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.27 Billing e planos SaaS

**Status:** planejada. sem modelo comercial implementado. **Falta:** planos, limites, cobrança e onboarding.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.28 Portal do cliente

**Status:** planejada. decisão registrada, sem código. **Falta:** token, aprovação, acompanhamento e assinatura.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.

## 3.29 Backups offsite e observabilidade

**Status:** planejada. runbook cita lacuna. **Falta:** automação, retenção, logs e alertas.

**Telas:** `/appointments`, `/branches`, `/customers`, `/dashboard`.

**Rotas representativas:** `GET/PATCH/DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`, `GET/POST /api/appointments`, `GET/POST /api/auth/:all*`, `PATCH/DELETE /api/branches/:id`, `GET/POST /api/branches`, `GET/PATCH/DELETE /api/customers/:id`, `GET/POST /api/customers`.
