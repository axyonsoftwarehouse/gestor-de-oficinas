-- =============================================================================
-- Papel de aplicação para DEV/TESTE (senha padrão 'app_gestor').
-- -----------------------------------------------------------------------------
-- Em produção (Neon) o papel já existe: o bloco abaixo apenas garante os grants.
-- Em um banco de teste local, cria o papel NOBYPASSRLS para o RLS valer de fato.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_gestor') then
    create role app_gestor login password 'app_gestor' nosuperuser nobypassrls;
  end if;
end $$;

grant usage on schema public to app_gestor;
grant select, insert, update, delete on all tables in schema public to app_gestor;
grant usage, select on all sequences in schema public to app_gestor;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_gestor;
alter default privileges in schema public
  grant usage, select on sequences to app_gestor;
