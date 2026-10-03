-- =============================================================================
-- Gestor de Oficinas — Row Level Security (multi-tenant)
-- -----------------------------------------------------------------------------
-- Aplique APÓS `prisma migrate deploy`:  pnpm db:rls
--
-- Modelo: schema único + `tenant_id` nas tabelas de negócio. O backend define,
-- por requisição, `app.current_tenant` dentro de uma transação, e o RLS restringe
-- as linhas ao tenant corrente.
--
-- IMPORTANTE (Neon): a conexão da aplicação deve usar um papel SEM `BYPASSRLS`.
-- O owner padrão do Neon (`neondb_owner`) tem `bypassrls = true`, então NÃO serve.
-- Crie o papel de aplicação uma vez (fora deste arquivo, pois envolve senha):
--
--   create role app_gestor login password 'TROQUE-A-SENHA' nosuperuser nobypassrls;
--   grant usage on schema public to app_gestor;
--   grant select, insert, update, delete on all tables in schema public to app_gestor;
--   grant usage, select on all sequences in schema public to app_gestor;
--   alter default privileges for role neondb_owner in schema public
--     grant select, insert, update, delete on tables to app_gestor;
--   alter default privileges for role neondb_owner in schema public
--     grant usage, select on sequences to app_gestor;
--
-- E use esse papel em `APP_DATABASE_URL`.
--
-- Tabelas de autenticação/plataforma (users, tenants, roles, permissions,
-- memberships, roles, sessions, accounts, verifications) NÃO usam RLS, pois são
-- consultadas antes de o tenant ser conhecido.
-- =============================================================================

-- Tenant corrente (vazio/ausente => NULL => nenhuma linha visível).
create or replace function public.current_tenant_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

-- Aplica RLS + política de isolamento às tabelas-raiz de negócio.
do $$
declare
  t text;
  tabelas text[] := array[
    'branches', 'customers', 'vehicle_brands', 'vehicle_models', 'vehicle_types',
    'vehicle_colors', 'vehicle_fuel_types', 'vehicles', 'vehicle_history',
    'product_categories', 'units', 'taxes', 'service_catalogs', 'part_catalogs',
    'suppliers', 'service_parts', 'stock_locations', 'stock_movements',
    'stock_balances', 'appointments', 'business_hours', 'holidays',
    'inspection_templates', 'inspections', 'job_cards', 'quotations', 'invoices',
    'payments', 'payment_methods', 'expenses', 'attachments', 'notes',
    'custom_fieldsets', 'custom_field_definitions', 'custom_field_values',
    'audit_logs', 'number_sequences', 'purchases'
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
        using (tenant_id = public.current_tenant_id())
        with check (tenant_id = public.current_tenant_id());
    $f$, t);
  end loop;
end $$;
