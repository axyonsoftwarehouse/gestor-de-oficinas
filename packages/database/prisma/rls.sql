-- =============================================================================
-- Gestor de Oficinas — Row Level Security (multi-tenant)
-- -----------------------------------------------------------------------------
-- O Prisma não gera RLS. Aplique este arquivo APÓS `prisma migrate deploy`:
--   psql "$DATABASE_URL" -f prisma/rls.sql
--
-- Modelo: schema único + tenant_id em todas as tabelas-raiz de negócio.
-- O backend deve, por requisição, executar dentro da mesma transação/conexão:
--   SELECT set_config('app.current_tenant', '<tenant-uuid>', true);
--
-- Observação: as tabelas-filhas (linhas, respostas, itens, taxas, junções) não
-- têm tenant_id próprio; são protegidas pelo pai via FK e pelo escopo de tenant
-- na camada de aplicação (extensão do Prisma Client). O RLS aqui cobre as
-- tabelas-raiz, que é onde o isolamento é decidido.
-- =============================================================================

-- Tenant corrente (vazio/ausente => NULL => nenhuma linha visível).
create or replace function current_tenant_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

-- Aplica RLS + política de isolamento a todas as tabelas-raiz com tenant_id.
do $$
declare
  t text;
  tabelas text[] := array[
    'branches',
    'memberships',
    'customers',
    'vehicle_brands',
    'vehicle_models',
    'vehicle_types',
    'vehicle_colors',
    'vehicle_fuel_types',
    'vehicles',
    'vehicle_history',
    'product_categories',
    'units',
    'taxes',
    'service_catalogs',
    'part_catalogs',
    'suppliers',
    'service_parts',
    'stock_locations',
    'stock_movements',
    'stock_balances',
    'appointments',
    'business_hours',
    'holidays',
    'inspection_templates',
    'inspections',
    'job_cards',
    'quotations',
    'invoices',
    'payments',
    'payment_methods',
    'expenses',
    'attachments',
    'notes',
    'custom_fieldsets',
    'custom_field_definitions',
    'custom_field_values',
    'audit_logs',
    'number_sequences'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);

    -- Remove política anterior (idempotência).
    execute format('drop policy if exists tenant_isolation on %I;', t);

    execute format($f$
      create policy tenant_isolation on %I
        as permissive
        for all
        using (tenant_id = current_tenant_id())
        with check (tenant_id = current_tenant_id());
    $f$, t);
  end loop;
end $$;

-- =============================================================================
-- Integridade referencial para Tenant (opcional, mas recomendada)
-- -----------------------------------------------------------------------------
-- O schema Prisma deixa `tenant_id` como coluna simples (índice) para manter o
-- modelo enxuto. A FK abaixo garante que não existam tenants órfãos.
-- Descomente para aplicar:
-- =============================================================================
-- do $$
-- declare t text;
-- begin
--   foreach t in array array[
--     'branches','memberships','customers','vehicle_brands','vehicle_models',
--     'vehicle_types','vehicle_colors','vehicle_fuel_types','vehicles',
--     'vehicle_history','product_categories','units','taxes','service_catalogs',
--     'part_catalogs','suppliers','service_parts','stock_locations',
--     'stock_movements','stock_balances','appointments','business_hours',
--     'holidays','inspection_templates','inspections','job_cards','quotations',
--     'invoices','payments','payment_methods','expenses','attachments','notes',
--     'custom_fieldsets','custom_field_definitions','custom_field_values',
--     'audit_logs','number_sequences'
--   ] loop
--     execute format(
--       'alter table %I add constraint fk_%s_tenant foreign key (tenant_id) references tenants(id) on delete cascade;',
--       t, t);
--   end loop;
-- exception when duplicate_object then null;
-- end $$;

-- =============================================================================
-- Papel de aplicação (recomendado em produção)
-- -----------------------------------------------------------------------------
-- O RLS é ignorado pelo owner da tabela a menos que FORCE ROW LEVEL SECURITY
-- esteja ativo (aplicado acima). Use um papel de aplicação separado do owner:
--
--   create role app_gestor login password '...';
--   grant usage on schema public to app_gestor;
--   grant select, insert, update, delete on all tables in schema public to app_gestor;
--   grant usage, select on all sequences in schema public to app_gestor;
-- =============================================================================
