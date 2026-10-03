# Gestor de Oficinas — Análise Comparativa dos Projetos de Referência

> Documento de apoio à decisão. Objetivo: extrair o melhor de três sistemas de gestão de
> oficina automotiva (referências) e traduzir isso em recomendações concretas para um novo
> produto **SaaS multiempresa**, com stack **Node/TypeScript**, app **mobile do mecânico** e
> **operação offline**.

---

## 1. Contexto e decisões do projeto

| Item | Decisão |
|---|---|
| Produto | Gestor de Oficinas — gestão de **oficina de veículos** |
| Modelo de negócio | **SaaS multiempresa** (vários clientes/oficinas isolados) |
| Stack alvo | **Node/TypeScript** (ex.: NestJS no backend + React/Next no front) |
| Plataformas | Web desktop **+ app mobile do mecânico + operação offline** |
| Escopo prioritário (v1) | Inspeção/checklist, Job card/OS + orçamento, Peças/estoque, Financeiro, Mecânicos/agendamento, Portal do cliente, Relatórios/PDF, Filiais/equipe |

Este documento cobre: (a) ficha técnica dos três projetos, (b) matriz comparativa de features,
(c) padrões a **adotar** e a **evitar**, (d) arquitetura recomendada e (e) roadmap sugerido.

---

## 2. Ficha técnica dos projetos de referência

### 2.1 Garage Master (Mojoomla / Dasinfomedia)
- **Stack:** Laravel 12, PHP 8.2, Blade + Bootstrap 4/jQuery, mPDF, PhpSpreadsheet, Stripe.
- **Natureza:** produto comercial "on-premise", com instalador web e ativação de licença/domínio.
- **Abrangência:** o mais **horizontal** dos três — cobre financeiro, estoque, compras, RTO,
  gate pass, washbay, RH/papéis, multi-filial, ~90 idiomas, campos customizados.
- **Pontos fortes:** amplitude de módulos, multi-filial nativo, matriz granular de ~150
  permissões, biblioteca de observações/inspeção por modelo de veículo, campos customizados,
  addons (providers dinâmicos), Stripe Connect, lembretes agendados.
- **Pontos fracos:** "fat controllers" com SQL cru, modelos vazios, MyISAM sem FKs, sem
  migrations reais, estoque denormalizado, falhas graves de segurança (ex.: login por ID sem
  token na aprovação de orçamento), código morto, sem testes.

### 2.2 tk_advance_vehicle_repair (TechKhedut)
- **Stack:** módulo **Odoo 19**, Python/ORM, XML/QWeb, SCSS/JS (OWL), ApexCharts + fabric.js.
- **Natureza:** extensão de ERP nativo, integrado a `fleet`, `sale`, `project`, `hr_timesheet`,
  `stock`, `product`, `portal`, `website`.
- **Abrangência:** o mais **profundo em inspeção e job card** — booking/agendamento com slots,
  inspeção multiponto, scratch report com editor de imagem e assinatura, repair job com
  ciclo de estados, equipes de serviço → tarefas, orçamento → fatura, portal web.
- **Pontos fortes:** fluxo ponta-a-ponta rastreável (booking → inspeção → reparo → OS →
  fatura), inspeção orientada a templates, editor de avarias com assinatura digital, portal
  do cliente com booking e e-sign, relatórios PDF, dashboard, 7 idiomas, suíte de testes.
- **Pontos fracos:** código monolítico, forte duplicação entre inspeção e reparo, lógica em
  `onchange` (não dispara em API/portal), estado não travado no servidor, `sudo()` excessivo,
  tokens permanentes, dependência de CDN, estoque raso, matemática de imposto manual.

### 2.3 Workshop Management (GreenTech) — módulo Perfex CRM
- **Stack:** CodeIgniter 3 / Perfex CRM, PHP, MySQL, TCPDF, Highcharts, DataTables.
- **Natureza:** add-on de CRM, integrado a clientes, faturas/itens, impostos, staff/papéis,
  tarefas, projetos, arquivos e (opcional) Warehouse.
- **Abrangência:** forte em **inspeção com builder de templates**, repair job com muitos
  status, mecânicos/agenda, peças+mão de obra (BOM parcial), logística de entrega/devolução,
  barcode/QR, portal do cliente e relatórios.
- **Pontos fortes:** construtor de inspeção (template → seções → perguntas tipadas), aprovação
  do cliente que **condiciona o faturamento**, tracking number EAN-13 + QR, recibos 80mm e A4,
  portal de acompanhamento, relatório de condição do equipamento e performance de mecânico,
  intervalos de manutenção, permissões granulares.
- **Pontos fracos:** sem migrations (schema procedural + `ALTER TABLE` em runtime), god objects
  (6k+ linhas), tabelas sobrecarregadas, status duplicados/legados, dois sistemas de campos
  customizados, resíduo de licenciamento, sem API REST, sem testes.

---

## 3. Matriz comparativa de features

Legenda: **●** nativo/maduro · **◐** parcial/simplificado · **○** ausente · **—** N/A

| Área / Feature | Garage Master | Odoo Vehicle Repair | Perfex Workshop |
|---|:--:|:--:|:--:|
| **Veículos e cadastros** | | | |
| Veículo + marca/modelo/tipo/cor/combustível | ● | ● (fleet) | ◐ (device genérico) |
| Histórico de manutenção / odômetro | ● | ● | ● |
| Frotas / múltiplos veículos por cliente | ◐ | ● (fleet) | ◐ |
| **Agendamento** | | | |
| Booking de serviço | ● | ● | ● |
| Slots por dia/horário | ○ | ● | ◐ (calendar) |
| Tipos de agendamento com produtos padrão | ◐ | ◐ | ● |
| **Inspeção / checklist** | | | |
| Biblioteca de observações chargeáveis | ● | ● | ● |
| Templates de inspeção configuráveis | ◐ | ● | ● (builder) |
| Seções + perguntas tipadas + obrigatório | ○ | ● | ● |
| Resultado por item (ok / reparar / atenção) | ◐ | ● | ● |
| Inspeção multiponto por categoria (motor, freios, pneus…) | ◐ | ● | ● |
| Editor de imagem de avarias (scratch) | ○ | ● | ○ |
| Assinatura do cliente / e-sign | ◐ | ● | ◐ |
| **Job card / OS** | | | |
| OS com ciclo de status | ● | ● | ● |
| Aprovação do cliente antes de executar | ● | ● | ● |
| Atribuição a mecânico/técnico por linha | ◐ | ● | ● |
| Tarefas de execução (checklist de reparo) | ◐ | ● | ◐ |
| Vínculo com projeto/tarefa (timesheet) | ◐ | ● | ● (projects) |
| Gate pass / liberação do veículo | ● | ○ | ○ |
| **Orçamento e financeiro** | | | |
| Orçamento → aprovação → OS | ● | ● | ● |
| Fatura + pagamento parcial | ● | ● | ● |
| Gateway de pagamento | ● (Stripe) | ◐ (Odoo) | ◐ (Perfex) |
| Impostos configuráveis / HSN-SAC | ● | ● | ● |
| Despesas / receitas / fluxo de caixa | ● | ◐ | ◐ |
| **Peças e estoque** | | | |
| Catálogo de peças/serviços | ● | ● | ● |
| Fornecedores + compras | ● | ● | ◐ |
| Movimentação de estoque (ledger confiável) | ◐ (denormalizado) | ◐ | ◐ |
| BOM de mão de obra (peças por serviço) | ○ | ◐ | ● |
| Reserva/consumo de peças pela OS | ○ | ○ | ◐ |
| **Mecânicos e equipe** | | | |
| Cadastro de mecânicos/técnicos | ● | ● | ● (via staff) |
| Agenda/calendário de capacidade | ◐ | ● | ● |
| Equipes de serviço | ◐ | ● | ◐ |
| Performance de mecânico | ◐ | ◐ | ● |
| **Relatórios e documentos** | | | |
| Dashboard / KPIs | ● | ● | ● |
| PDF de orçamento/OS/fatura | ● | ● | ● |
| Etiqueta com barcode/QR | ○ | ○ | ● |
| Recibo térmico 80mm | ◐ | ○ | ● |
| Relatórios operacionais/financeiros | ● | ◐ | ● |
| Export Excel/CSV | ● | ◐ (xlwt) | ● |
| **Cliente** | | | |
| Portal do cliente | ◐ | ● | ● |
| Acompanhamento por código/token | ◐ | ● (token) | ● (tracking) |
| Notificações e-mail/SMS | ● | ● (mail) | ● |
| Lembretes de próxima manutenção | ● | ◐ | ● |
| **Plataforma / gestão** | | | |
| Multi-filial | ● | ● (multi-company) | ● (branches) |
| Papéis e permissões granulares | ● (~150) | ● (grupos+ACL) | ● (10 áreas) |
| Campos customizados | ● | ◐ | ● (duplo) |
| Multi-idioma | ● (~90) | ● (7) | ● (24) |
| API REST / app mobile | ◐ (mínima) | ◐ (RPC) | ○ |
| Operação offline | ○ | ○ | ○ |

**Leitura da matriz:**
- **Odoo** lidera em inspeção, ciclo de OS, booking com slots, editor de avarias e portal.
- **Perfex** lidera em builder de inspeção, aprovação que libera faturamento, barcode/QR,
  recibos, performance de mecânico e intervalos de manutenção.
- **Garage Master** lidera em amplitude administrativa: financeiro, estoque, compras, filiais,
  campos customizados, idiomas, e é o único com gate pass/washbay.
- **Nenhum** dos três tem operação **offline** — é o principal diferencial a construir.

---

## 4. Padrões a ADOTAR (o que copiar)

### 4.1 Do Odoo Vehicle Repair
1. **Fluxo ponta-a-ponta rastreável:** Booking → Inspeção → Reparo → OS → Orçamento → Fatura,
   com FKs que ligam cada documento ao job card de origem (rastreabilidade total).
2. **Inspeção multiponto orientada a template** com estado por item (ok/atenção/reparar).
3. **Editor de imagem de avarias** (canvas: desenho, seta, texto, destaque) + **assinatura
   digital** do cliente — reutilizar conceito (fabric.js ou Konva/Excalidraw-like).
4. **Agendamento com slots** por dia/horário, validando disponibilidade em tempo real.
5. **Ticket/OS como "hub"** que agrega checklist, peças, serviços, imagens, timesheet e faturas.
6. **Portal do cliente com token** para aprovar orçamento, acompanhar e assinar.
7. **Equipe de serviço → tarefa** (atribuição por linha de serviço, com responsável).

### 4.2 Do Perfex Workshop
1. **Builder de templates de inspeção:** template → seções → perguntas tipadas (texto, select,
   número, anexo…) com flag *obrigatório* e reordenação.
2. **Aprovação do cliente condiciona o faturamento:** só itens `good` e itens `repair`
   aprovados entram na fatura.
3. **Tracking number + código de barras EAN-13 + QR** para etiqueta e deep-link do portal.
4. **Documentos de saída prontos:** recibo térmico 80mm, relatório A4 e etiqueta.
5. **Relatórios de valor:** condição do equipamento (frequência de reparo → bom/atenção/
   crítico), resumo de OS, performance de mecânico.
6. **Intervalos de manutenção** → cálculo automático da próxima manutenção (data/horas).
7. **Permissões por área** com variação `visualizar / ver apenas os próprios / criar / editar /
   excluir`.

### 4.3 Do Garage Master
1. **Multi-filial** como cidadão de primeira classe (todo dado operacional escopado por filial).
2. **Campos customizados por formulário** armazenados estruturadamente (JSON tipado).
3. **Lembretes automáticos de próxima manutenção** por agendamento/job.
4. **Financeiro integrado:** compra gera despesa; fatura gera receita; pagamento parcial.
5. **Biblioteca de observações chargeáveis** por modelo de veículo (reaproveitável entre OS).
6. **i18n e moeda desde o dia 1** (e RTL quando fizer sentido).

### 4.4 Padrões transversais recomendados (nenhum dos três faz bem)
- **Idempotência** em todas as operações de escrita (essencial para offline/sync).
- **Máquina de estados aplicada no servidor** (não só botões de UI).
- **Ledger de estoque** (movimentos imutáveis) em vez de saldo denormalizado.
- **Outbox/eventos de domínio** para notificações, sync e integrações.
- **Auditoria** de todas as mudanças relevantes.
- **Migrations versionadas** e testes automatizados.

---

## 5. Anti-padrões a EVITAR (o que não repetir)

| Anti-padrão observado | Onde | Alternativa recomendada |
|---|---|---|
| Fat controllers / god objects (6k+ linhas) | Os 3 | Módulos por domínio, casos de uso finos |
| Lógica só em `onchange` | Odoo | Regras no domínio/serviço (API-safe) |
| Máquina de estados não validada no server | Odoo | Enforced transitions no backend |
| Sem migrations, schema procedural | GM, Perfex | Migrations versionadas (Prisma) |
| Tabelas sobrecarregadas / status duplicados | Perfex | Modelo normalizado, status como enum único |
| Estoque denormalizado sem ledger | GM, Odoo | Livro de movimentos + projeções |
| SQL cru interpolado / sem FKs | GM | ORM + constraints + RLS |
| Segurança frágil (login por ID, sudo, token eterno) | GM, Odoo | Auth multi-tenant + tokens expiráveis |
| Duplicação inspeção × reparo | Odoo | Modelo único de "job" com tipo |
| Dois sistemas de campos customizados | Perfex | Um único motor de campos dinâmicos |
| Sem API REST | Perfex | API versionada (OpenAPI) desde o início |
| Dependências via CDN | Odoo | Bundling versionado |
| Sem testes / sem fila | Os 3 | Testes + filas (BullMQ) |
| Licença/instalador acoplado | GM, Perfex | SaaS: provisioning e billing separados |

---

## 6. Arquitetura recomendada (Node/TypeScript, SaaS multiempresa)

### 6.1 Stack sugerida
- **Backend:** NestJS (TypeScript) como **monólito modular** (não microsserviços no início).
- **Banco:** PostgreSQL. **Multi-tenant** por padrão = schema único + `tenant_id` em todas as
  tabelas + **Row Level Security (RLS)**; opção futura de schema-por-tenant para clientes
  enterprise. Isolamento garantido por middleware + RLS.
- **ORM:** Prisma (migrations versionadas, tipagem forte).
- **API:** REST versionada + OpenAPI; considerar tRPC para o front administrativo se for
  monorepo TS.
- **Front web:** Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Query,
  react-hook-form + zod.
- **Mobile (mecânico):** React Native + Expo.
- **Offline:** **PowerSync** para sincronização PostgreSQL ↔ SQLite local, com idempotência e
  resolução de conflito nas escritas.
- **Jobs/filas:** BullMQ + Redis (PDF, e-mail/SMS, lembretes, sync).
- **Arquivos:** storage S3-compatível com upload pré-assinado.
- **PDF:** serviço headless (Playwright/Puppeteer) renderizando HTML→PDF; recibos 80mm e A4.
- **Auth:** e-mail/senha + refresh tokens, RBAC/ABAC por papel e por filial; tokens de portal
  de cliente **expiráveis** para aprovação/assinatura.
- **Observabilidade:** logs estruturados, tracing (OpenTelemetry), métricas.

### 6.2 Organização macro (multi-tenant)
```
Plataforma (SaaS)
 └── Tenant (oficina/empresa)
      └── Branch (filial)
           ├── Usuários & Papéis
           ├── Clientes
           ├── Veículos
           ├── Agendamentos
           ├── Inspeções / OS / Orçamentos / Faturas
           ├── Estoque / Compras
           └── Relatórios
```
Toda consulta é escopada por `tenant_id`; dentro do tenant, por `branch_id` conforme permissão.

### 6.3 Modelo de domínio sugerido (núcleo)
- **Tenancy/Auth:** `Tenant`, `Branch`, `User`, `Role`, `Permission`, `Membership`, `AuditLog`.
- **Clientes/Veículos:** `Customer`, `Vehicle`, `VehicleBrand`, `VehicleModel`, `VehicleType`,
  `Color`, `FuelType`, `VehicleHistoryRecord`.
- **Agenda:** `Appointment`, `AppointmentType`, `AppointmentSlot`, `BusinessHour`, `Holiday`.
- **Inspeção:** `InspectionTemplate`, `InspectionSection`, `InspectionField`,
  `Inspection`, `InspectionAnswer` (result: good/repair/attention/na), `InspectionMedia`.
- **Execução:** `JobCard` (tipo: inspeção/reparo/serviço), `JobCardItem` (labor/part/service),
  `JobStatusHistory`, `Assignment`, `RepairChecklist`.
- **Catálogo/Estoque:** `Service`, `Part`, `ProductCategory`, `Unit`, `Supplier`, `Tax`,
  `StockLocation`, `StockMovement` (ledger), `Purchase`/`PurchaseItem`, `InventoryCount`.
- **Orçamento/Financeiro:** `Quotation`/`QuoteItem`, `Approval`, `Invoice`/`InvoiceItem`,
  `Payment`, `PaymentMethod`, `Expense`, `Income`, `CashFlowEntry`.
- **Logística/Documentos:** `ReturnDelivery`, `GatePass`, `Document` (PDF), `Attachment`, `Note`.
- **Integrações/Sync:** `Notification`, `OutboxEvent`, `SyncLog`, `IdempotencyKey`.

### 6.4 Estratégia offline-first (mobile do mecânico) — decidida: **PowerSync**
1. **Sync gerenciada:** PowerSync mantém um **SQLite local** sincronizado com o PostgreSQL do
   tenant, com regras de sync por filial/usuário.
2. **Escritas offline:** o app escreve primeiro no SQLite local; o PowerSync faz upload
   assíncrono quando houver rede, com **UUID/idempotência** para evitar duplicação.
3. **Resolução de conflito explícita** (last-write-wins para campos simples; merge/review para
   estados críticos de OS).
4. **Fotos** ficam em storage local e sobem em background (upload pré-assinado no S3).
5. **Estado de OS com transições idempotentes** para tolerar reenvio.

### 6.5 Portal do cliente
- Acesso por **link com token expirável** + login opcional.
- Aprovação/rejeição de orçamento, acompanhamento por tracking number, download de laudos e
  assinatura digital (canvas) — inspirado no Odoo e no Perfex.

---

## 7. Roadmap sugerido (fases)

**Fase 0 — Fundação**
- Monorepo (NestJS + Next + Expo), multi-tenant (RLS), autenticação/RBAC, auditoria,
  i18n/moeda, migrations, pipeline de CI, storage de arquivos e geração de PDF.

**Fase 1 — Núcleo operacional (v1 — escopo enxuto decidido)**
- Clientes, veículos (marca/modelo/tipo), agendamento simples, **inspeção básica**, **job card/OS
  unificado** com itens de mão de obra e peças, atribuição de mecânico, ciclo de status,
  orçamento → aprovação → fatura com pagamento parcial, recibo A4 e financeiro simples.
- Estoque/peças entram de forma simplificada; as demais áreas vêm nas fases seguintes.

**Fase 2 — Inspeção avançada e execução em campo**
- **Builder de templates de inspeção**, inspeção multiponto com estado por item, checklist de
  reparo, editor de imagem de avarias, evidências (fotos), assinatura e **app mobile
  offline-first (PowerSync)**.

**Fase 3 — Estoque, financeiro e filiais**
- Catálogo/serviços/peças, ledger de estoque, compras/fornecedores, despesas/receitas, fluxo de
  caixa, multi-filial, campos customizados, gate pass.

**Fase 4 — Cliente e inteligência**
- Portal do cliente (acompanhamento/aprovação/assinatura), notificações e lembretes de
  manutenção, dashboard/KPIs, relatórios (condição do veículo, performance de mecânico,
  financeiro), etiquetas barcode/QR e recibo 80mm.

**Fase 5 — Escala SaaS**
- Billing/planos, onboarding self-service, limites por plano, backups por tenant, observabilidade
  avançada, API pública, integrações (pagamento, WhatsApp/e-mail, contabilidade).

---

## 8. Decisões de arquitetura fechadas

| Tema | Decisão |
|---|---|
| Multi-tenancy | **Schema único + `tenant_id` + Row Level Security (RLS)** no PostgreSQL. Isolamento por middleware + RLS. |
| Offline | **PowerSync** (sync PostgreSQL ↔ SQLite), com idempotência e resolução de conflito explícita. |
| Modelo de OS | **Job unificado** (`JobCard` com tipo: inspeção/reparo/serviço) — evita a duplicação do Odoo/Perfex. |
| Escopo da v1 | **Núcleo enxuto:** OS + orçamento/aprovação + inspeção básica + financeiro simples (+ estoque simplificado). Demais áreas em fases. |
| Portal do cliente | **Aprovação de orçamento + acompanhamento + assinatura digital**, via token expirável. |
| PDF | **Serviço headless dedicado** (Playwright/Puppeteer) em HTML→PDF, suportando A4, recibo 80mm e etiquetas. |
| Repositório | **Monorepo** (pnpm + Turborepo) com `apps/api`, `apps/web`, `apps/mobile` e `packages/*`. |
| Estoque | **Ledger de movimentos** imutáveis desde o início (não repetir saldo denormalizado). |
| Estados | **Máquina de estados aplicada no servidor**, com transições idempotentes. |

### Pendências menores (não bloqueiam o início)
- Provedor de e-mail/SMS (ex.: Resend/SES + Twilio/Zenvia) e de storage S3 (AWS vs MinIO).
- Modelo de billing do SaaS (Stripe Billing vs outro) e definição de planos/limites.
- Política de retenção de mídia (fotos/laudos) e backup por tenant.

---

## 9. Anexo — Inventário resumido de entidades por referência

- **Garage Master (tbl_* + novas):** users/roles, branches, `tbl_vehicles`, `tbl_vehicle_types`,
  `tbl_vehicle_brands`, `tbl_model_names`, `tbl_colors`, `tbl_fuel_types`, `tbl_services`,
  `tbl_jobcard_details`, `tbl_service_pros`, `tbl_checkout_categories`/`tbl_points`,
  `tbl_service_observation_points`, `tbl_products`, `tbl_purchase*`, `tbl_stock_records`,
  `tbl_invoices`, `tbl_payment_records`, `tbl_incomes`/`tbl_expenses`, `tbl_gatepasses`,
  `tbl_rto_taxes`, `tbl_custom_fields`, `notes`, `washbays`, `tbl_mail_notifications`,
  MOT (`inspection_points_library`, `mot_vehicle_inspection`, `vehicle_mot_test_reports`).
- **Odoo Vehicle Repair:** `vehicle.booking`, `booking.appointment(.slot)`, `vehicle.brand/model/
  fuel.type`, `inspection.job.card`(+`inspection.checklist`,`inspection.image`),
  `repair.job.card`(+`repair.checklist`,`repair.image`), `classic.inspection.template`,
  `checklist.template`, `vehicle.part.info`/`vehicle.spare.part`, `service.team`/
  `vehicle.service.team`, `register.vehicle`/`service.history`, `scratch.report`,
  `terms.condition.template`, + heranças de `fleet.vehicle`, `sale.order`, `account.move`,
  `project.task`, `res.partner`, `product.template`, `account.analytic.line`.
- **Perfex Workshop (wshop_*):** branches, manufacturers, categories, models, appointment_types
  (+products), fieldsets/customfields, intervals, delivery_methods, holidays, devices,
  labour_products (+materials/BOM), inspection_templates → forms → form_details,
  inspections → repair_inspection_templates → inspection_forms → form_details → values,
  repair_jobs (+labour_products/labour_materials), return_deliveries (+notes), workshops,
  activity; integra com clientes, faturas/itens, staff/papéis, tarefas e projetos do Perfex.

---

### Fontes consultadas (caminhos locais)
- `C:\1.Arquivos Gerais\Fonte de Inspiração - Oficina\Garage Master`
- `C:\1.Arquivos Gerais\Fonte de Inspiração - Oficina\tk_advance_vehicle_repair-19.0.4.6`
- `C:\1.Arquivos Gerais\Fonte de Inspiração - Oficina\Workshop Management Perfex CRM v1.0`
