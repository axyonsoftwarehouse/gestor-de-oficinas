-- Limpa todas as tabelas do schema public (exceto o histórico de migrations).
-- Uso: banco de TESTE. Aplicar antes/depois da suíte para estado limpo.
do $$
declare
  r record;
begin
  for r in
    select tablename from pg_tables
    where schemaname = 'public' and tablename <> '_prisma_migrations'
  loop
    execute format('truncate table %I cascade', r.tablename);
  end loop;
end $$;
