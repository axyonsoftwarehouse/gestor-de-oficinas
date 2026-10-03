-- =============================================================================
-- Gestor de Oficinas — Row Level Security (multi-tenant) + papel de aplicação
-- -----------------------------------------------------------------------------
-- Aplique APÓS `prisma migrate deploy`:
--   pnpm db:rls
--
-- Modelo: schema único + tenant_id nas tabelas de negócio. O backend define,
-- por requisição, `app.current_tenant` dentro de uma transação, e o RLS
-- restringe as linhas ao tenant corrente.
--
-- Tabelas de autenticação/plataforma (users, tenants, roles, permissions,
-- memberships, refresh_tokens) NÃO têm RLS, pois são consultadas antes de o
-- tenant ser conhecido.
-- =============================================================================

-- Tenant corrente (vazio/ausente => NULL => nenhuma linha visível).
create or replace function current_tenant_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

-- Tabelas de autenticação/plataforma NÃO usam RLS (consultadas antes do tenant).
alter table if exists memberships disable row level security;
drop policy if exists tenant_isolation on memberships;

-- Papel de aplicação (não-superusuário) para a RLS valer de fato.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_gestor') then
    create role app_gestor login password 'app_gestor' nosuperuser;
  end if;
end $$;

grant usage on schema public to app_gestor;
grant select, insert, update, delete on all tables in schema public to app_gestor;
grant usage, select on all sequences in schema public to app_gestor;

-- Tabelas/sequências criadas futuramente pelo owner `gestor`.
alter default privileges for role gestor in schema public
  grant select, insert, update, delete on tables to app_gestor;
alter default privileges for role gestor in schema public
  grant usage, select on sequences to app_gestor;

-- Aplica RLS + política de isolamento às tabelas-raiz de negócio.
do $$
declare
  t text;
  tabelas text[] := array[
    'branches',
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
    'number_sequences',
    'purchases'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
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
