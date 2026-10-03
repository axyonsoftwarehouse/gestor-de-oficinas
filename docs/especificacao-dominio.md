# Gestor de Oficinas — Especificação de Domínio (base para o schema)

> Resultado do passe técnico direcionado nos 3 projetos de referência, focado nos subsistemas
> que mais impactam o schema: **inspeção/template, máquinas de estado, pricing/impostos,
> estoque/BOM, campos customizados e RBAC/escopo**. Cada seção termina com o **modelo
> recomendado** para o novo sistema (stack Node/TS, SaaS multiempresa — ver
> `analise-projetos-referencia.md`).

---

## 1. Motor de inspeção / template / checklist

### 1.1 Panorama das três implementações

| Dimensão | Odoo | Perfex | Garage Master |
|---|---|---|---|
| Entidade template | `checklist.template` + `classic.inspection.template` | `wshop_inspection_templates → _template_forms → _template_form_details` | **Não existe** header de template; biblioteca global/per-veículo |
| Níveis | Template → itens (1) ou template → 7 seções fixas → partes | Template → form → field (3) | pergunta → resposta |
| Execução | Job card + linhas por tipo de parte | `wshop_inspections → _inspection_forms → _form_details → _values` | `mot_vehicle_inspection.answer_question_id` (JSON) |
| Template x execução | Cópia via `onchange` (sem FK) | **Snapshot copiado** no 1º acesso | Referência direta por id no JSON |
| Resultado por item | 4 booleanos mutuamente exclusivos | `good` / `repair` (+ approve) | `ok / x / r / na` (hardcoded no Blade) |
| Comentário por item | Ausente (clássico) | Sim (`comment`, `approve_comment`) | Não (vai para a linha de serviço) |
| Anexo por item | 1 imagem `Binary` inline | tipo `attachment` | Não |

Referências: Odoo `models/checklist_template.py`, `classic_inspection_template.py`,
`vehicle_part_info.py`, `multi_point_inspection.py`, `inspection_job_card.py`; Perfex
`install.php:189-251,545-596`, `helpers/workshop_inspection_helper.php:154-322,575-765`,
`Workshop_model.php:4513-4591`; GM `instaltionController.php:50054-50063,50466-50483,50144-50154`,
`jobcard_form.blade.php:644-647`.

### 1.2 Catálogo de tipos de campo (Perfex = mais completo)

`input`, `number`, `date_picker`, `date_picker_time`, `textarea`, `colorpicker`, `select`,
`multiselect`, `checkbox`, `attachment`, `link`. As opções ficam em `options` (JSON) — não há
tabela de opções. GM: só 4 valores fixos. Odoo: não há tipos de pergunta; usa catálogo de partes.

### 1.3 Fatos que definem o schema

- **Nenhum** dos três tem condicional "mostrar se" real (só liga/desliga seção).
- **Nenhum** tem tabela de opções normalizada (JSON ou hardcode).
- **Odoo** usa 4 booleanos por linha (não enum) → estado inconsistente, modelos quase clonados
  (7 linhas × 7 seções).
- **Perfex** faz snapshot de template→execução (bom), mas sem versionamento; `fieldto`/`slug`
  são `TEXT` tratados como FK; anexo é indexado pela **pergunta**, não pela resposta.
- **GM** guarda tudo em um JSON de uma coluna (`answer_question_id`), sem FK/índice/comment.
- **Gate de fatura:** só o Perfex condiciona o faturamento à aprovação
  (`good` ou `repair AND approve='approved'`) — `Workshop_model.php:5316-5334`.

### 1.4 Modelo recomendado

```
InspectionTemplate (tenant_id, branch_id?, name, version, status)
  └─ InspectionTemplateVersion (template_id, version, published_at)   ← versionamento
       └─ InspectionSection (version_id, title, sequence, display_type: section|note)
            └─ InspectionQuestion (section_id, code, label, type enum, options JSON,
                                   required, sequence, visible_to_customer,
                                   conditional_parent_id, conditional_operator, conditional_value)
                 └─ InspectionQuestionOption (question_id, label, value, sequence)  ← normalizado

Inspection (tenant_id, branch_id, job_card_id, template_version_id, status, ...)
  └─ InspectionAnswer (inspection_id, question_id, value, result enum
                       [ok|good|attention|repair|na|not_inspected], comment,
                       approved enum [pending|approved|rejected], approved_by, approved_at)
       └─ AnswerAttachment (answer_id, file_id)   ← ligado à RESPOSTA, não à pergunta
```

Decisões: `type` e `result` como **enum**; opções em tabela própria; snapshot por
**version** do template; gate de fatura via `result`/`approved`; biblioteca reutilizável de
pontos/partes com `vehicle_model_id` anulável (geral) e junção normalizada.

---

## 2. Máquinas de estado

### 2.1 Odoo — `inspection.job.card`
`a_draft → b_in_progress → in_review → {reject → c_complete} / c_complete → locked`; cancel em
`b_in_progress/in_review`. **Guardas reais:** `reject_to_c_complete` exige checklist completo e
toda seção habilitada não vazia; demais transições livres. `reject` não tem saída direta p/ complete.

### 2.2 Odoo — `repair.job.card`
`draft → assign_to_technician → in_diagnosis → supervisor_inspection → {reject → complete} /
complete → {hold, cancel, locked}`. Guardas: `draft→assign` exige equipe + membros por linha;
`in_diagnosis→supervisor` exige `all(work_is_done)`; `supervisor→complete` exige todas as tasks
done + checklist completo. `all()` de vazio = True (bypass possível).

### 2.3 Odoo — `vehicle.booking`
`draft → vehicle_inspection | vehicle_repair | vehicle_inspection_repair | cancel`. Guarda:
data ≥ hoje + slot disponível. Cada transição cria o(s) job card(s) correspondentes.

### 2.4 Perfex — repair job / inspection / transaction
- Repair: `Booked_In, In_Progress, Cancelled, Waiting_For_Parts, Finalised, Waiting_For_User_Approval`.
  **Dropdown lista todos os destinos** (sem validação origem→destino). Efeito: sincroniza status
  do "device" (em reparo / ativo).
- Inspection: `Open → In_Progress → Waiting_For_Approval → Waiting_For_Parts →
  Complete_Awaiting_Finalise → Completed` (+ `Overdue` nunca escrito). Aprovação do cliente move p/
  `Complete_Awaiting_Finalise`.
- Transaction (entrega/devolução): `Pending, Scheduled, In_Transit, Delivered, Failed, Sent, Cancelled`
  — só permissão como guarda.

### 2.5 Garage Master
- `tbl_services.done_status` (varchar!): `0` open, `1` done, `2` progress — atualizado por SQL cru,
  podendo divergir de `tbl_jobcard_details.done_status`.
- Cotação: `quotation_modify_status` (0/1/2) + `is_appove` (null/0/1/2) — sobrecarregado.
- Washbay `initiate_status` 0/1/2; gatepass `ser_pro_status` sempre `1`. Status mortos:
  `employee_status`, `tbl_quotation.status`.

### 2.6 Modelo recomendado
- **Job unificado** (`JobCard`) com `type` (inspection | repair | service) e **um** enum de status.
- **Enum de status estável** + **tabela de transições** (`AllowedTransition(from, to, guardKey)`)
  validada no servidor; guardas como funções de domínio (não só UI).
- **Histórico de status** (`JobStatusHistory`: from, to, by, at, reason) para auditoria.
- Transições que criam documentos (orçamento, fatura, tasks) disparam **eventos de domínio**
  (outbox), não efeitos colaterais espalhados.
- Entrega/devolução com sua própria máquina, vinculada ao JobCard.

---

## 3. Pricing, impostos e a ponte orçamento→OS→fatura

### 3.1 Fatos

| Tema | Odoo | Perfex | Garage Master |
|---|---|---|---|
| Linha de documento | `sale.order.line` (core) | tabelas separadas labour/materials | `tbl_service_pros` (unificada) |
| Imposto | M2M `account.tax` + `compute_all` (suporta inclusivo) | pipe-delimited em TEXT (`"2\|1"`), soma simples, só exclusivo | `tax_json` `{id:rate}` + tabela por serviço |
| Desconto | **Inexistente** nas linhas | % por linha + cabeçalho (`before/after tax`) | % por linha e documento |
| Totais | sempre recalculados pelo core | **calculado no browser** e confiado no POST | matemática manual repetida em vários controllers |
| Tipos monetários | Monetary/M2M | DECIMAL(15,2) | **varchar** em várias colunas |
| Ponte | job → `sale.order` → `account.move` (FK recíproca) | job → fatura core (ajuste; desconto vira adjustment) | serviço = cotação e OS; fatura por string `job_card` |

Problemas-chave: Perfex confia no total do cliente e perde o desconto na fatura; GM tem receita
reconhecida na criação da fatura e tipos varchar; Odoo não propaga desconto e grava em campos
compute não-store.

### 3.2 Modelo recomendado
- **Linha única** `DocumentLine` (FK polimórfica ao documento: quotation | job | invoice) com
  `item_type` (labor | part | service | fee), `description`, `quantity NUMERIC`, `unit_price
  NUMERIC`, `unit_id`, `discount_type` (percent|amount), `discount_value`, `tax_base`,
  `tax_amount`, `total` — **NUMERIC**, não string.
- **Imposto relacional:** `LineTax(line_id, tax_id, base, amount)` + catálogo `Tax`.
  Suportar **inclusivo/exclusivo** e múltiplos impostos; cálculo no servidor, uma só função.
- **Ponte com rastreabilidade por FK:** cotação → OS → fatura referenciando o item de origem
  (`origin_line_id`), copiando ou recalculando de forma determinística (nunca confiar no client).
- **Fatura separada de recebimento:** `Invoice` + `InvoicePayment`/`Payment` (parciais),
  `payment_status` derivado; receita reconhecida no pagamento/competência.
- Numeração por **sequência transacional** (sem `max(id)+1`).

---

## 4. Estoque, consumo e BOM

### 4.1 Fatos

| Tema | Odoo | Perfex | Garage Master |
|---|---|---|---|
| Saldo | core `stock` (`stock.move`/`quant`) — ledger real | delega ao módulo Warehouse (`tblinventory_manage`) | **saldo denormalizado** `no_of_stoke` + derivados |
| Entrada | compra core | Warehouse | compra soma saldo |
| Saída OS | delivery do SO | goods delivery na fatura | **não baixa** (só grava linha) |
| BOM | **não existe** | `wshop_labour_product_materials` (serviço→itens) | **não existe** |
| Multi-filial | `company`/warehouse | `wshop_branches` (sem filtro na checagem) | `branch_id` amplo, mas 4 funções de saldo sem filtro |
| Reserva | padrão do SO | **não** | **não** |

### 4.2 Modelo recomendado
- **Ledger de estoque** `StockMovement(id, tenant_id, branch_id, location_id, item_id, qty,
  type enum [purchase|issue_to_job|sale|return|adjustment|transfer], ref_type, ref_id, unit_cost,
  created_at)` — saldo é **projeção** (view/materialized), nunca coluna editável.
- **Localizações** `StockLocation(branch_id, name)` e estoque por localização.
- **BOM** `ServicePart` (service_id, part_id, quantity) — consumo da OS baixa via
  `issue_to_job` com FK ao `JobCardItem`, com **reserva** opcional.
- Custo capturado no movimento (`unit_cost`) para margem; multi-filial filtrado por regra central.

---

## 5. Campos customizados

### 5.1 Fatos
- **GM:** definição `tbl_custom_fields` (`form_name`, `label`, `type`, `required`,
  `radio_labels`/`checkbox_labels` JSON); **valores em coluna JSON** `custom_field` da própria
  entidade (`[{id,value}]`), migrada p/ LONGTEXT. Tipos: textbox, date, textarea, radio, checkbox.
- **Perfex:** definição `wshop_customfields` (+ `fieldset_id`, flags `show_on_pdf`,
  `show_on_client_portal`, `only_admin`, `disalow_client_to_edit`, etc.); **valores EAV**
  `wshop_customfieldsvalues(relid, fieldid, fieldto, value)`. Tipos: input, number, date,
  datetime, textarea, colorpicker, select, multiselect, checkbox, link. Opções JSON.
- **Odoo:** sem sistema nativo neste módulo (seria Studio/`ir.model.fields`).

### 5.2 Modelo recomendado
- **EAV bem-feito:** `CustomFieldDefinition(tenant_id, branch_id?, entity_type (indexado),
  fieldset_id?, code, label, type enum, options (JSON/ChildOptions), required, order,
  show_on_pdf, show_on_portal, client_editable, active)`.
- `CustomFieldValue(entity_type (indexado), entity_id, field_id, value)` com **UNIQUE
  (entity_type, entity_id, field_id)** e FK; multi-valor normalizado (não CSV).
- `CustomFieldset` para agrupar; nunca blob JSON por entidade (evita o erro do GM).

---

## 6. RBAC e escopo multiempresa / filial

### 6.1 Fatos
- **GM:** dois sistemas paralelos (`tbl_accessrights` + `roles.permissions` JSON com ~150 gates);
  ações `view/add/edit/delete/owndata`; super admin via `is_admin`; escopo de filial **manual em
  831 pontos**; `branch_setting` é linha única global.
- **Perfex:** RBAC do core (`staff_permissions`), 10 áreas × `view/view_own/create/edit/delete`;
  filial só em `wshop_repair_jobs`.
- **Odoo:** grupos Manager/Receptionist/Supervisor/Technician + ACL CSV por modelo/ação + regras
  por registro (`responsible_id = user.id`); multi-company em só 5 modelos; portal com write=1.

### 6.2 Modelo recomendado
- **RBAC normalizado:** `Role`, `Permission(feature, action)` com ações canônicas
  `view | view_own | create | edit | delete | approve`, `RolePermission(role_id, permission_id)`,
  `UserRole(user_id, role_id, branch_id?)` — **nunca JSON blob**.
- **Ownership por coluna explícita** (`owner_id`/`responsible_id`) e regra por registro — não por
  nome de papel em string.
- **Escopo central (não manual):** `tenant_id` **obrigatório** em toda tabela de negócio;
  `branch_id` onde aplicável; aplicar via **middleware/global scope + RLS** no PostgreSQL, não em
  831 pontos. `custom fields` também escopados por tenant/branch.
- Bypass de admin explícito e auditável (não por flag possivelmente inativa).

---

## 7. Checklist de decisões de schema derivadas

- [ ] `tenant_id` em **todas** as tabelas de negócio + RLS no Postgres.
- [ ] `branch_id` em documentos operacionais; estoque por `StockLocation`.
- [ ] Tipos monetários/quantidade em `NUMERIC` (nunca varchar); datas em `date/timestamptz`.
- [ ] Enums de status **únicos e estáveis** + tabela de transições + guardas no servidor + histórico.
- [ ] Imposto relacional (`LineTax`) com cálculo central (inclusivo/exclusivo, múltiplos).
- [ ] Desconto explícito (`discount_type`, `discount_value`) por linha e por documento.
- [ ] Rastreabilidade por FK entre cotação → OS → fatura (`origin_line_id`) e job card ↔ documentos.
- [ ] Fatura separada de pagamento; `payment_status` derivado; receita no pagamento/competência.
- [ ] Ledger de estoque + BOM; saldo por projeção.
- [ ] Inspeção: template versionado, seções, perguntas tipadas, opções em tabela, resposta com
      `result`/`comment`/`approve`, anexo ligado à resposta; gate de fatura pela aprovação.
- [ ] Custom fields EAV com UNIQUE/FK e `entity_type` indexado; nada de JSON por entidade.
- [ ] RBAC normalizado por recurso×ação; ownership por coluna; escopo central via RLS/middleware.
- [ ] Sequências de numeração transacionais; triggers/índices únicos onde há número de documento.
- [ ] Auditoria (`AuditLog`), eventos de domínio (outbox) e idempotência desde o início.
