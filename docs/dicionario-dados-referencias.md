# Gestor de Oficinas — Dicionário de Dados das Referências (consolidado)

> Extração do DDL/modelos reais dos três projetos, consolidada num **mapa canônico** para o novo
> schema. As extrações completas campo-a-campo estão registradas nas seções por projeto; aqui o
> foco é a correspondência entre as referências e o modelo-alvo.

---

## 1. Resumo quantitativo

| Projeto | Tecnologia | Estruturas | Observações |
|---|---|---|---|
| Garage Master | MySQL (MyISAM) via `instaltionController.php` | **68 tabelas distintas** (5 com `CREATE` duplicado) | Sem FKs; prefixos `tbl_` misturados com tabelas sem prefixo |
| Perfex Workshop | MySQL (InnoDB) via `install.php` | **31 tabelas `wshop_*`** + 1 coluna em `tblprojects` | Sem FKs declaradas; `ALTER TABLE` avulsos em controllers |
| Odoo Vehicle Repair | Odoo ORM (`models/*.py`) | **60 classes** (47 `_name`, 4 wizards/abstract, 9 `_inherit`) e **559 campos** | 7 locales; herda `fleet`, `sale`, `account`, `project`, `stock`, `product` |

---

## 2. Mapa canônico de entidades

> `—` = não existe na referência. Colunas `[escopo]` indicam onde está o tenant/filial.

| Entidade canônica | Garage Master | Perfex Workshop | Odoo Vehicle Repair |
|---|---|---|---|
| Tenant / Empresa | `updatekey.tenant_id` | (instalação por `db_prefix`) | `res.company` |
| Filial | `branches`, `branch_setting` (linha única) | `wshop_branches` | `res.company` (multi-company) |
| Usuário | `users` (role), `admins` | `staff` (core) | `res.users` |
| Papel / Permissão | `roles`, `role_users`, `tbl_accessrights` | `staff_permissions` (core) | `res.groups`, `ir.model.access.csv`, `ir.rules` |
| Cliente | `users.role=Customer` | `clients` (core) | `res.partner`, `register.vehicle` |
| Fornecedor | `users.role=Supplier` | (core) | `res.partner` |
| Veículo | `tbl_vehicles` | `wshop_devices` | `fleet.vehicle`, `register.vehicle`, `service.history` |
| Marca / Modelo | `tbl_vehicle_brands`, `tbl_model_names` | `wshop_manufacturers`, `wshop_models` | `vehicle.brand`, `vehicle.model` |
| Tipo / Cor / Combustível | `tbl_vehicle_types`, `tbl_colors`, `tbl_fuel_types` | `wshop_categories` | `vehicle.fuel.type` (+ cor textual) |
| Agendamento | `tbl_business_hours`, `tbl_holidays` | `wshop_appointment_types`, `wshop_holidays` | `vehicle.booking`, `booking.appointment`, `.slot` |
| Template de inspeção | `tbl_checkout_categories`, `tbl_points`, `inspection_points_library` | `wshop_inspection_templates → _forms → _form_details (+_values)` | `checklist.template`, `classic.inspection.template`, `vehicle.part.info` |
| Inspeção (execução) | `mot_vehicle_inspection` (JSON), `tbl_service_observation_points` | `wshop_inspections → _forms → _form_details → _values` | `inspection.job.card` + linhas por seção |
| OS / Job card | `tbl_services`, `tbl_jobcard_details` | `wshop_repair_jobs` | `repair.job.card` |
| Linhas da OS | `tbl_service_pros` | `wshop_repair_job_labour_products` + `_labour_materials` | `vehicle.spare.part`, `vehicle.order.spare.part`, `vehicle.service.team`, `inspection.repair.team` |
| Catálogo de serviço | (linha genérica) | `wshop_labour_products` | `product.product` (`is_vehicle_service`) |
| Peça / Produto | `tbl_products` | `tblitems` (core) | `product.product` (`is_vehicle_part`) |
| BOM (peças por serviço) | — | `wshop_labour_product_materials` | — |
| Compra | `tbl_purchases` + `tbl_purchase_history_records` | (Warehouse/core) | `purchase.order` (core) |
| Estoque | `tbl_stock_records` (denormalizado) | `tblinventory_manage` (Warehouse) | `stock.quant` / `stock.move` |
| Venda de peças | `tbl_sale_parts` | itens de fatura (core) | movimentos de estoque |
| Cotação / Orçamento | `tbl_services.is_quotation` + `tbl_quotation` (morta) | `wshop_repair_jobs` (campos `estimated_*`) | `sale.order` |
| Fatura | `tbl_invoices` | `invoices` (core), ref em `wshop_repair_jobs.invoice_id` | `account.move` |
| Pagamento | `tbl_payment_records`, `tbl_payments` | `invoicepaymentrecords` (core) | `account.payment` |
| Despesa / Receita | `tbl_expenses`, `tbl_incomes` (+ history) | (core) | `account.move` |
| Entrega / Devolução | `tbl_gatepasses`, `washbays` | `wshop_return_deliveries` + `_notes` | `stock.picking` |
| Notas / Anexos | `notes`, `note_attachments` | `tblfiles` (core), `wshop_return_delivery_notes` | `mail.message`, `ir.attachment` |
| Campos customizados | `tbl_custom_fields` + JSON na entidade | `wshop_customfields` + `_values` + `wshop_fieldsets` | (Studio/`ir.model.fields`) |
| Checklist (reparo) | — | (usa inspeção) | `checklist.template`, `repair.checklist` |
| Equipe / Tarefas | — | (projetos/tarefas core) | `service.team`, `project.task`, `account.analytic.line` |
| Termos / Avarias | — | — | `terms.condition.template`, `scratch.report` |

---

## 3. Detalhes por projeto

### 3.1 Garage Master — tabelas-chave (conjunto final de colunas)

| Tabela | Cols | Destaques |
|---|---:|---|
| `users` | 38 | `role`, `role_id`, `branch_id`, `language`, `custom_field` (JSON) |
| `roles` / `role_users` | 12 / 4 | `permissions` JSON; pivot sem PK |
| `branches` / `branch_setting` | 14 / 5 | Filial ativa em linha única (`id=1`) |
| `tbl_vehicles` | 26 | `vehicletype_id`, `vehiclebrand_id`, `fuel_id`; `price` varchar |
| `tbl_services` | 30 | `job_no`, `done_status` varchar, `is_appove`, `is_quotation`, `branch_id` |
| `tbl_jobcard_details` | 17 | in/out date, kms, `done_status` int |
| `tbl_service_pros` | 20 | linha unificada; `price`/`quantity`/`discount`/`tax_json` |
| `tbl_checkout_categories` / `tbl_points` | 8 / 15 | biblioteca de observações por veículo; `service_charge`, `tax_id` |
| `tbl_observation_types` / `tbl_observation_points` | 5 / 6 | biblioteca legada |
| `mot_vehicle_inspection` | 7 | `answer_question_id` JSON (`{qid: ok|x|r|na}`) |
| `tbl_products` | 26 | `price`/`selling_price`/`quantity` varchar; `branch_id` |
| `tbl_stock_records` | 7 | `no_of_stoke` (saldo denormalizado) |
| `tbl_purchases` / `tbl_purchase_history_records` | 12 / 10 | entrada de estoque; gera despesa |
| `tbl_sale_parts` | 15 | venda balcão (não baixa saldo no código analisado) |
| `tbl_invoices` | 24 | `total_amount`/`grand_total`/`paid_amount`/`amount_recevied`; `type` 0/1/2 |
| `tbl_payment_records` / `tbl_payments` | 11 / 5 | pagamentos parciais; métodos cash/card |
| `tbl_gatepasses` | 11 | `jobcard_id` varchar; `ser_pro_status` sempre 1 |
| `washbays` | 10 | `initiate_status` 0/1/2 |
| `tbl_custom_fields` | 11 | definição; valores JSON na entidade |
| `tbl_account_tax_rates` | 10 | `taxname`, `tax`, `tax_type`, `is_default` |
| `notes` / `note_attachments` | 9 / 6 | polimórfico por `entity_type`/`entity_id` |

Seed/geo (referência): `tbl_cities` (~48k), `tbl_states`, `tbl_countries`, `tbl_currency_records`,
`currencies`, `inspection_points_library` (73 pontos MOT).

### 3.2 Perfex Workshop — todas as tabelas `wshop_*`

| Grupo | Tabelas |
|---|---|
| Filial/catálogo | `branches`, `manufacturers`, `categories`, `models`, `appointment_types` (+`_products`), `fieldsets`, `intervals`, `delivery_methods`, `holidays`, `customfields` (+`values`) |
| Inspeção | `inspection_templates` → `inspection_template_forms` → `inspection_template_form_details` (+`_values`); `inspections` → `inspection_forms` → `inspection_form_details` → `inspection_values`; `repair_inspection_templates` |
| OS | `repair_jobs` (62 cols), `repair_job_labour_products`, `repair_job_labour_materials` |
| Catálogo/BOM | `labour_products`, `labour_product_materials` |
| Logística | `return_deliveries`, `return_delivery_notes`, `workshops`, `activity` |
| Device | `devices` (22 cols, `plate_number`, `current_hours`, `next_maintenance_hour`) |

Colunas de destaque: `wshop_inspection_values` (`value, inspection_result, comment, approve,
approve_comment, approved_date`); `wshop_repair_jobs` (8 campos `estimated_*` + `discount_*` +
`subtotal/total_tax/total`, `invoice_id`); linhas com `tax_id`/`tax_rate`/`tax_name` **TEXT
pipe-delimited**.

### 3.3 Odoo — modelos e campos-chave (de 559 campos)

- **Core:** `inspection.job.card` (133 campos, 7 one2many de seção + deltas), `repair.job.card`
  (68), `vehicle.booking` (42), `vehicle.service.team` (23), `inspection.repair.team` (21).
- **Linhas:** `vehicle.spare.part` (13), `vehicle.order.spare.part` (18), `task.spare.parts` (5),
  `exterior/interior/under_hood/under_vehicle/fluids/tires/brake` (7–10 cada).
- **Catálogos:** `vehicle.brand`, `vehicle.model`, `vehicle.fuel.type`, `vehicle.part.info`,
  `vehicle.component`, `vehicle.fluid`, `vehicle.condition`, `service.team`.
- **Templates/checklists:** `checklist.template(+item)`, `inspection.checklist`, `repair.checklist`,
  `classic.inspection.template`, `scratch.report`, `terms.condition.template`.
- **Herdados:** `fleet.vehicle` (+brand/model/fuel/transmission/vin), `sale.order`/`account.move`
  (+job card FKs), `project.task` (+`work_is_done`, peças), `product.template`
  (+`is_vehicle_part`/`is_vehicle_service`), `res.partner` (+`vehicle_count`),
  `account.analytic.line` (+service/job card).
- **Legado declarado (não usar):** `vehicle.service`, `vehicle.condition*`,
  `advance.exterior.item`, campos `tyre_inspection*`, `vehicle_fluid*`, `vehicle_component*`,
  `mechanical_condition*`, `*_body_inspection`, ~30 booleanos de opcionais.

---

## 4. Convenções, tipos e inconsistências (a corrigir no novo schema)

**Nomenclatura**
- GM mistura prefixos (`tbl_*` + tabelas sem prefixo) e tem typos consolidados: `jocard_no`,
  `coupan_no`, `no_of_stoke`, `muncipal_road_tax`, `assigne_to`, `is_appove`, `discription`,
  `currancy`, `amount_recevied`, `always_visable`, `disalow_client_to_edit`, `commpleted_date`.
- Perfex usa `staffid` (sem underscore) e `fieldto` como TEXT tratado como FK.

**Tipos**
- GM: valores monetários/quantidade como **varchar** (`tbl_vehicles.price`,
  `tbl_products.price/selling_price/quantity`, `tbl_service_pros.price/quantity/discount/total_price`);
  `customer_id` int em algumas tabelas e varchar em `tbl_invoices`; `jobcard_id` varchar em
  gatepass; datas como texto em `tbl_sale_parts`.
- Perfex: imposto como TEXT pipe-delimited; `type` de campo como TEXT livre.
- Odoo: resultado por 4 booleanos em vez de enum; campos `compute` sem `store` recebendo valor.

**Integridade**
- GM: **MyISAM**, sem FKs; `ALTER TABLE` tardios; ao menos 5 tabelas com `CREATE` duplicado.
- Perfex: sem FKs; EAV de custom fields sem UNIQUE; `ALTER TABLE` em runtime.
- Perfex/Odoo herdados dependem de módulos externos (Warehouse, stock, project).

**Escopo**
- GM: `branch_id` aplicado por `ALTER` em parte das tabelas; faltam em `tbl_jobcard_details`,
  `tbl_gatepasses`, `tbl_service_pros`, `tbl_quotation`, `vehicle_mot_test_reports`.
- Perfex: filial só em `wshop_repair_jobs`.
- Odoo: regra multi-company em apenas 5 modelos; `company_id=False` vaza entre empresas.

**Decisões de consolidação para o alvo**
- Prefixo/nomes consistentes, sem typos; tipos `NUMERIC`/`date`/`timestamptz`/`enum`.
- FKs explícitas e `tenant_id`/`branch_id` em todas as tabelas de negócio.
- Um único motor de campos customizados (EAV com UNIQUE/FK).
- Um único motor de inspeção (template → seções → perguntas → respostas) com versionamento.
- Ledger de estoque e BOM nativos; documentos (cotação/OS/fatura) com FK de origem e sequência
  transacional.
