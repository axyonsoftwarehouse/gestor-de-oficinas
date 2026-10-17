# Inventário de arquivos de código

> Estado: branch `main`, commit `83ac90f`, 09/10/2026. Comando-base: `git ls-files`.

**Fichas completas: 217 · Exceções em tabela: 12 · Total: 229 de 229 arquivos de código.**

Categorias rastreadas: 229 código · 28 configuração · 9 documentação · 0 ativos binários · 1 lock rastreado, excluído da leitura linha a linha. Total: 267.

## 1. Banco: modelo, runtime e segurança

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `packages/database/prisma/app-role.sql` | Banco: modelo, runtime e segurança | Cria/configura o papel de runtime sem BYPASSRLS e concede os privilégios necessários. | sim | — | [01-banco-modelo-e-seguranca.md §1.1](01-banco-modelo-e-seguranca.md) |
| `packages/database/prisma/rls.sql` | Banco: modelo, runtime e segurança | Ativa e define as políticas PostgreSQL de isolamento por tenant para tabelas de negócio. | sim | — | [01-banco-modelo-e-seguranca.md §1.2](01-banco-modelo-e-seguranca.md) |
| `packages/database/prisma/schema.prisma` | Banco: modelo, runtime e segurança | Fonte canônica dos 65 modelos, 23 enums, relações, índices e precisões do banco. | sim | — | [01-banco-modelo-e-seguranca.md §1.3](01-banco-modelo-e-seguranca.md) |
| `packages/database/src/index.ts` | Banco: modelo, runtime e segurança | Barrel público do pacote de banco. | sim | — | [01-banco-modelo-e-seguranca.md §1.4](01-banco-modelo-e-seguranca.md) |
| `packages/database/src/tenant-context.ts` | Banco: modelo, runtime e segurança | Mantém o tenant corrente em AsyncLocalStorage durante a requisição. | sim | — | [01-banco-modelo-e-seguranca.md §1.5](01-banco-modelo-e-seguranca.md) |
| `packages/database/src/tenant-extension.ts` | Banco: modelo, runtime e segurança | Adiciona defesa em profundidade ao Prisma, filtrando e preenchendo tenantId. | sim | — | [01-banco-modelo-e-seguranca.md §1.6](01-banco-modelo-e-seguranca.md) |

## 2. Banco: seeds, limpeza e migrations

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `packages/database/prisma/migrations/20260925191542_init/migration.sql` | Banco: seeds, limpeza e migrations | Migration Prisma versionada que altera a estrutura física do banco. | não; exceção | migration/artefato gerado | [02-banco-seeds-e-migrations.md §2.6](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/migrations/20260925195318_add_purchases/migration.sql` | Banco: seeds, limpeza e migrations | Migration Prisma versionada que altera a estrutura física do banco. | não; exceção | migration/artefato gerado | [02-banco-seeds-e-migrations.md §2.6](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/migrations/20261003120000_add_user_default_tenant/migration.sql` | Banco: seeds, limpeza e migrations | Migration Prisma versionada que altera a estrutura física do banco. | não; exceção | migration/artefato gerado | [02-banco-seeds-e-migrations.md §2.6](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/migrations/20261003130000_better_auth/migration.sql` | Banco: seeds, limpeza e migrations | Migration Prisma versionada que altera a estrutura física do banco. | não; exceção | migration/artefato gerado | [02-banco-seeds-e-migrations.md §2.6](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/migrations/20261007120000_add_purchase_expense_and_cost/migration.sql` | Banco: seeds, limpeza e migrations | Migration Prisma versionada que altera a estrutura física do banco. | não; exceção | migration/artefato gerado | [02-banco-seeds-e-migrations.md §2.6](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/seed-mock.ts` | Banco: seeds, limpeza e migrations | Cria dados iniciais ou demonstrativos necessários a seed-mock.ts. | sim | — | [02-banco-seeds-e-migrations.md §2.1](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/seed.ts` | Banco: seeds, limpeza e migrations | Cria dados iniciais ou demonstrativos necessários a seed.ts. | sim | — | [02-banco-seeds-e-migrations.md §2.2](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/seed/mock.ts` | Banco: seeds, limpeza e migrations | Cria dados iniciais ou demonstrativos necessários a mock.ts. | sim | — | [02-banco-seeds-e-migrations.md §2.3](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/seed/permissions.ts` | Banco: seeds, limpeza e migrations | Cria dados iniciais ou demonstrativos necessários a permissions.ts. | sim | — | [02-banco-seeds-e-migrations.md §2.4](02-banco-seeds-e-migrations.md) |
| `packages/database/prisma/test-truncate.sql` | Banco: seeds, limpeza e migrations | Limpa dados mutáveis do banco de teste entre suítes, preservando a estrutura. | sim | — | [02-banco-seeds-e-migrations.md §2.5](02-banco-seeds-e-migrations.md) |

## 3. Código compartilhado, mobile e ferramentas

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/mobile/App.tsx` | Código compartilhado, mobile e ferramentas | Tela inicial do futuro aplicativo mobile do mecânico. | sim | — | [03-compartilhado-mobile-e-ferramentas.md §3.1](03-compartilhado-mobile-e-ferramentas.md) |
| `packages/shared/src/index.ts` | Código compartilhado, mobile e ferramentas | Barrel público do pacote compartilhado. | sim | — | [03-compartilhado-mobile-e-ferramentas.md §3.2](03-compartilhado-mobile-e-ferramentas.md) |
| `packages/shared/src/permissions.ts` | Código compartilhado, mobile e ferramentas | Catálogo único das permissões e agrupamentos funcionais do produto. | sim | — | [03-compartilhado-mobile-e-ferramentas.md §3.3](03-compartilhado-mobile-e-ferramentas.md) |
| `packages/shared/src/roles.ts` | Código compartilhado, mobile e ferramentas | Templates dos papéis padrão e suas permissões. | sim | — | [03-compartilhado-mobile-e-ferramentas.md §3.4](03-compartilhado-mobile-e-ferramentas.md) |
| `scripts/pg-test.ps1` | Código compartilhado, mobile e ferramentas | Baixa e controla uma instância PostgreSQL portátil exclusiva para testes locais. | sim | — | [03-compartilhado-mobile-e-ferramentas.md §3.5](03-compartilhado-mobile-e-ferramentas.md) |

## 4. Frontend compartilhado

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/globals.css` | Frontend compartilhado | Tokens visuais, base Tailwind, tema claro/escuro e estilos globais. | sim | — | [04-frontend-base.md §4.1](04-frontend-base.md) |
| `apps/web/src/app/layout.tsx` | Frontend compartilhado | Layout raiz do Next.js e ponto de montagem dos provedores globais. | sim | — | [04-frontend-base.md §4.2](04-frontend-base.md) |
| `apps/web/src/app/login/page.tsx` | Frontend compartilhado | Implementa a página `/login` para consultar e operar login no painel. | sim | — | [04-frontend-base.md §4.3](04-frontend-base.md) |
| `apps/web/src/app/page.tsx` | Frontend compartilhado | Implementa a página `/` para consultar e operar page.tsx no painel. | sim | — | [04-frontend-base.md §4.4](04-frontend-base.md) |
| `apps/web/src/components/app-shell.tsx` | Frontend compartilhado | Shell autenticado com navegação, cabeçalho e área principal. | sim | — | [04-frontend-base.md §4.5](04-frontend-base.md) |
| `apps/web/src/components/auth-provider.tsx` | Frontend compartilhado | Disponibiliza sessão e ações de autenticação à árvore React. | sim | — | [04-frontend-base.md §4.6](04-frontend-base.md) |
| `apps/web/src/components/charts.tsx` | Frontend compartilhado | Componentes SVG simples usados nos indicadores e relatórios. | sim | — | [04-frontend-base.md §4.7](04-frontend-base.md) |
| `apps/web/src/components/providers.tsx` | Frontend compartilhado | Compõe provedores globais, incluindo React Query e autenticação. | sim | — | [04-frontend-base.md §4.8](04-frontend-base.md) |
| `apps/web/src/components/theme-toggle.tsx` | Frontend compartilhado | Alterna e persiste o tema claro/escuro. | sim | — | [04-frontend-base.md §4.9](04-frontend-base.md) |
| `apps/web/src/components/ui.tsx` | Frontend compartilhado | Biblioteca local de componentes visuais básicos do painel. | sim | — | [04-frontend-base.md §4.10](04-frontend-base.md) |
| `apps/web/src/lib/api.ts` | Frontend compartilhado | Cliente HTTP comum do navegador, com JSON, cookies e tratamento uniforme de erros. | sim | — | [04-frontend-base.md §4.11](04-frontend-base.md) |
| `apps/web/src/lib/auth-client.ts` | Frontend compartilhado | Cliente Better Auth usado pelo navegador para sessão, login e logout. | sim | — | [04-frontend-base.md §4.12](04-frontend-base.md) |
| `apps/web/src/lib/format.ts` | Frontend compartilhado | Formatadores de dinheiro, datas e valores exibidos pela interface. | sim | — | [04-frontend-base.md §4.13](04-frontend-base.md) |
| `apps/web/src/lib/queries.ts` | Frontend compartilhado | Hooks React Query reutilizáveis para opções e catálogos frequentes. | sim | — | [04-frontend-base.md §4.14](04-frontend-base.md) |
| `apps/web/src/lib/types.ts` | Frontend compartilhado | Tipos de transporte consumidos pelas páginas do painel. | sim | — | [04-frontend-base.md §4.15](04-frontend-base.md) |
| `apps/web/src/middleware.ts` | Frontend compartilhado | Protege a navegação de páginas pela presença do cookie de sessão e redireciona para login. | sim | — | [04-frontend-base.md §4.16](04-frontend-base.md) |
| `apps/web/src/types/jsx.d.ts` | Frontend compartilhado | Complementa a declaração global do namespace JSX para o build atual. | sim | — | [04-frontend-base.md §4.17](04-frontend-base.md) |

## 5. Páginas e layouts web

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/(app)/appointments/page.tsx` | Páginas e layouts web | Implementa a página `/appointments` para consultar e operar agendamentos no painel. | sim | — | [05-paginas-web.md §5.1](05-paginas-web.md) |
| `apps/web/src/app/(app)/branches/page.tsx` | Páginas e layouts web | Implementa a página `/branches` para consultar e operar filiais no painel. | sim | — | [05-paginas-web.md §5.2](05-paginas-web.md) |
| `apps/web/src/app/(app)/customers/page.tsx` | Páginas e layouts web | Implementa a página `/customers` para consultar e operar clientes no painel. | sim | — | [05-paginas-web.md §5.3](05-paginas-web.md) |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Páginas e layouts web | Implementa a página `/dashboard` para consultar e operar dashboard no painel. | sim | — | [05-paginas-web.md §5.4](05-paginas-web.md) |
| `apps/web/src/app/(app)/expenses/page.tsx` | Páginas e layouts web | Implementa a página `/expenses` para consultar e operar despesas no painel. | sim | — | [05-paginas-web.md §5.5](05-paginas-web.md) |
| `apps/web/src/app/(app)/inspection-templates/[id]/page.tsx` | Páginas e layouts web | Implementa a página `/inspection-templates/:id` para consultar e operar templates de inspeção no painel. | sim | — | [05-paginas-web.md §5.6](05-paginas-web.md) |
| `apps/web/src/app/(app)/inspection-templates/page.tsx` | Páginas e layouts web | Implementa a página `/inspection-templates` para consultar e operar templates de inspeção no painel. | sim | — | [05-paginas-web.md §5.7](05-paginas-web.md) |
| `apps/web/src/app/(app)/inspections/[id]/page.tsx` | Páginas e layouts web | Implementa a página `/inspections/:id` para consultar e operar inspeções no painel. | sim | — | [05-paginas-web.md §5.8](05-paginas-web.md) |
| `apps/web/src/app/(app)/inspections/page.tsx` | Páginas e layouts web | Implementa a página `/inspections` para consultar e operar inspeções no painel. | sim | — | [05-paginas-web.md §5.9](05-paginas-web.md) |
| `apps/web/src/app/(app)/invoices/[id]/page.tsx` | Páginas e layouts web | Implementa a página `/invoices/:id` para consultar e operar faturas no painel. | sim | — | [05-paginas-web.md §5.10](05-paginas-web.md) |
| `apps/web/src/app/(app)/invoices/page.tsx` | Páginas e layouts web | Implementa a página `/invoices` para consultar e operar faturas no painel. | sim | — | [05-paginas-web.md §5.11](05-paginas-web.md) |
| `apps/web/src/app/(app)/job-cards/[id]/page.tsx` | Páginas e layouts web | Implementa a página `/job-cards/:id` para consultar e operar ordens de serviço no painel. | sim | — | [05-paginas-web.md §5.12](05-paginas-web.md) |
| `apps/web/src/app/(app)/job-cards/page.tsx` | Páginas e layouts web | Implementa a página `/job-cards` para consultar e operar ordens de serviço no painel. | sim | — | [05-paginas-web.md §5.13](05-paginas-web.md) |
| `apps/web/src/app/(app)/layout.tsx` | Páginas e layouts web | Layout do painel autenticado que envolve as páginas com o shell. | sim | — | [05-paginas-web.md §5.14](05-paginas-web.md) |
| `apps/web/src/app/(app)/parts/page.tsx` | Páginas e layouts web | Implementa a página `/parts` para consultar e operar peças no painel. | sim | — | [05-paginas-web.md §5.15](05-paginas-web.md) |
| `apps/web/src/app/(app)/purchases/page.tsx` | Páginas e layouts web | Implementa a página `/purchases` para consultar e operar compras no painel. | sim | — | [05-paginas-web.md §5.16](05-paginas-web.md) |
| `apps/web/src/app/(app)/quotations/[id]/page.tsx` | Páginas e layouts web | Implementa a página `/quotations/:id` para consultar e operar orçamentos no painel. | sim | — | [05-paginas-web.md §5.17](05-paginas-web.md) |
| `apps/web/src/app/(app)/quotations/page.tsx` | Páginas e layouts web | Implementa a página `/quotations` para consultar e operar orçamentos no painel. | sim | — | [05-paginas-web.md §5.18](05-paginas-web.md) |
| `apps/web/src/app/(app)/roles/page.tsx` | Páginas e layouts web | Implementa a página `/roles` para consultar e operar papéis e permissões no painel. | sim | — | [05-paginas-web.md §5.19](05-paginas-web.md) |
| `apps/web/src/app/(app)/services/page.tsx` | Páginas e layouts web | Implementa a página `/services` para consultar e operar catálogo de serviços no painel. | sim | — | [05-paginas-web.md §5.20](05-paginas-web.md) |
| `apps/web/src/app/(app)/stock/page.tsx` | Páginas e layouts web | Implementa a página `/stock` para consultar e operar estoque no painel. | sim | — | [05-paginas-web.md §5.21](05-paginas-web.md) |
| `apps/web/src/app/(app)/suppliers/page.tsx` | Páginas e layouts web | Implementa a página `/suppliers` para consultar e operar fornecedores no painel. | sim | — | [05-paginas-web.md §5.22](05-paginas-web.md) |
| `apps/web/src/app/(app)/team/page.tsx` | Páginas e layouts web | Implementa a página `/team` para consultar e operar team no painel. | sim | — | [05-paginas-web.md §5.23](05-paginas-web.md) |
| `apps/web/src/app/(app)/vehicles/page.tsx` | Páginas e layouts web | Implementa a página `/vehicles` para consultar e operar veículos no painel. | sim | — | [05-paginas-web.md §5.24](05-paginas-web.md) |

## 6. Infraestrutura do servidor

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/scripts/seed-owner.ts` | Infraestrutura do servidor | Cria ou atualiza o usuário proprietário por meio do Better Auth. | sim | — | [06-infraestrutura-do-servidor.md §6.1](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/auth/auth.ts` | Infraestrutura do servidor | Configura o Better Auth com Prisma e cookies da aplicação. | sim | — | [06-infraestrutura-do-servidor.md §6.2](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/auth/dto/register-tenant.dto.ts` | Infraestrutura do servidor | Implementa a responsabilidade de register-tenant.dto.ts na camada infraestrutura do servidor. | sim | — | [06-infraestrutura-do-servidor.md §6.3](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/auth/provision.ts` | Infraestrutura do servidor | Provisiona atomicamente usuário, tenant, filial, vínculo e papel owner. | sim | — | [06-infraestrutura-do-servidor.md §6.4](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/auth/require-session.ts` | Infraestrutura do servidor | Resolve usuário, tenant ativo, vínculo, papéis e permissões da sessão. | sim | — | [06-infraestrutura-do-servidor.md §6.5](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/auth/with-route.ts` | Infraestrutura do servidor | Wrapper das rotas que aplica sessão, RBAC, tenant, transação e tradução de erro. | sim | — | [06-infraestrutura-do-servidor.md §6.6](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/db/prisma-context.ts` | Infraestrutura do servidor | Guarda a transação Prisma corrente no contexto assíncrono. | sim | — | [06-infraestrutura-do-servidor.md §6.7](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/db/prisma.ts` | Infraestrutura do servidor | Cria os clientes Prisma de aplicação e sistema e entrega a conexão contextual. | sim | — | [06-infraestrutura-do-servidor.md §6.8](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/db/with-tenant.ts` | Infraestrutura do servidor | Abre a transação, define app.current_tenant e executa a requisição sob RLS. | sim | — | [06-infraestrutura-do-servidor.md §6.9](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/http/errors.ts` | Infraestrutura do servidor | Define erros HTTP tipados do servidor. | sim | — | [06-infraestrutura-do-servidor.md §6.10](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/http/handle-error.ts` | Infraestrutura do servidor | Converte exceções conhecidas em respostas JSON seguras. | sim | — | [06-infraestrutura-do-servidor.md §6.11](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/http/params.ts` | Infraestrutura do servidor | Valida parâmetros de rota, especialmente UUIDs. | sim | — | [06-infraestrutura-do-servidor.md §6.12](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/http/parse-body.ts` | Infraestrutura do servidor | Transforma e valida body/query com class-transformer e class-validator. | sim | — | [06-infraestrutura-do-servidor.md §6.13](06-infraestrutura-do-servidor.md) |
| `apps/web/src/server/http/rate-limit.ts` | Infraestrutura do servidor | Implementa limitação simples de requisições em memória. | sim | — | [06-infraestrutura-do-servidor.md §6.14](06-infraestrutura-do-servidor.md) |

## 7. DTOs comuns e de cadastros

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/server/dtos/create-branch.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateBranchDto usado nas entradas de filiais. | sim | — | [07-dtos-comuns-e-cadastros.md §7.1](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-customer.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateCustomerDto usado nas entradas de clientes. | sim | — | [07-dtos-comuns-e-cadastros.md §7.2](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-part.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreatePartDto usado nas entradas de peças. | sim | — | [07-dtos-comuns-e-cadastros.md §7.3](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-role.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateRoleDto usado nas entradas de papéis e permissões. | sim | — | [07-dtos-comuns-e-cadastros.md §7.4](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-service.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateServiceDto usado nas entradas de catálogo de serviços. | sim | — | [07-dtos-comuns-e-cadastros.md §7.5](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-supplier.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateSupplierDto usado nas entradas de fornecedores. | sim | — | [07-dtos-comuns-e-cadastros.md §7.6](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-user.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateUserDto usado nas entradas de usuários/equipe. | sim | — | [07-dtos-comuns-e-cadastros.md §7.7](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/create-vehicle.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado CreateVehicleDto usado nas entradas de veículos. | sim | — | [07-dtos-comuns-e-cadastros.md §7.8](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/pagination.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado PaginationDto usado nas entradas de pagination.dto.ts. | sim | — | [07-dtos-comuns-e-cadastros.md §7.9](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/partial-type.ts` | DTOs comuns e de cadastros | Define o contrato validado PartialType, isPartialDto usado nas entradas de peças. | sim | — | [07-dtos-comuns-e-cadastros.md §7.10](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-balance.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryBalanceDto usado nas entradas de estoque. | sim | — | [07-dtos-comuns-e-cadastros.md §7.11](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-customer.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryCustomerDto usado nas entradas de clientes. | sim | — | [07-dtos-comuns-e-cadastros.md §7.12](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-part.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryPartDto usado nas entradas de peças. | sim | — | [07-dtos-comuns-e-cadastros.md §7.13](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-service.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryServiceDto usado nas entradas de catálogo de serviços. | sim | — | [07-dtos-comuns-e-cadastros.md §7.14](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-supplier.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QuerySupplierDto usado nas entradas de fornecedores. | sim | — | [07-dtos-comuns-e-cadastros.md §7.15](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-user.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryUserDto usado nas entradas de usuários/equipe. | sim | — | [07-dtos-comuns-e-cadastros.md §7.16](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/query-vehicle.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado QueryVehicleDto usado nas entradas de veículos. | sim | — | [07-dtos-comuns-e-cadastros.md §7.17](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-branch.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateBranchDto usado nas entradas de filiais. | sim | — | [07-dtos-comuns-e-cadastros.md §7.18](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-customer.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateCustomerDto usado nas entradas de clientes. | sim | — | [07-dtos-comuns-e-cadastros.md §7.19](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-part.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdatePartDto usado nas entradas de peças. | sim | — | [07-dtos-comuns-e-cadastros.md §7.20](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-role.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateRoleDto usado nas entradas de papéis e permissões. | sim | — | [07-dtos-comuns-e-cadastros.md §7.21](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-service.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateServiceDto usado nas entradas de catálogo de serviços. | sim | — | [07-dtos-comuns-e-cadastros.md §7.22](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-supplier.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateSupplierDto usado nas entradas de fornecedores. | sim | — | [07-dtos-comuns-e-cadastros.md §7.23](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-user.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateUserDto usado nas entradas de usuários/equipe. | sim | — | [07-dtos-comuns-e-cadastros.md §7.24](07-dtos-comuns-e-cadastros.md) |
| `apps/web/src/server/dtos/update-vehicle.dto.ts` | DTOs comuns e de cadastros | Define o contrato validado UpdateVehicleDto usado nas entradas de veículos. | sim | — | [07-dtos-comuns-e-cadastros.md §7.25](07-dtos-comuns-e-cadastros.md) |

## 8. DTOs de operação

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/server/dtos/assign-mechanic.dto.ts` | DTOs de operação | Define o contrato validado AssignMechanicDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.1](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-appointment.dto.ts` | DTOs de operação | Define o contrato validado CreateAppointmentDto usado nas entradas de agendamentos. | sim | — | [08-dtos-operacao.md §8.2](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-inspection-template.dto.ts` | DTOs de operação | Define o contrato validado CreateQuestionOptionDto, CreateQuestionDto, CreateSectionDto, CreateInspectionTemplateDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.3](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-job-card.dto.ts` | DTOs de operação | Define o contrato validado CreateJobCardDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.4](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-job-line.dto.ts` | DTOs de operação | Define o contrato validado CreateJobLineDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.5](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-location.dto.ts` | DTOs de operação | Define o contrato validado CreateLocationDto usado nas entradas de estoque. | sim | — | [08-dtos-operacao.md §8.6](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/create-movement.dto.ts` | DTOs de operação | Define o contrato validado CreateMovementDto usado nas entradas de estoque. | sim | — | [08-dtos-operacao.md §8.7](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/issue-to-job.dto.ts` | DTOs de operação | Define o contrato validado IssueToJobDto usado nas entradas de issue-to-job.dto.ts. | sim | — | [08-dtos-operacao.md §8.8](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/query-appointment.dto.ts` | DTOs de operação | Define o contrato validado QueryAppointmentDto usado nas entradas de agendamentos. | sim | — | [08-dtos-operacao.md §8.9](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/query-inspection-template.dto.ts` | DTOs de operação | Define o contrato validado QueryInspectionTemplateDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.10](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/query-inspection.dto.ts` | DTOs de operação | Define o contrato validado QueryInspectionDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.11](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/query-job-card.dto.ts` | DTOs de operação | Define o contrato validado QueryJobCardDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.12](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/query-movement.dto.ts` | DTOs de operação | Define o contrato validado QueryMovementDto usado nas entradas de estoque. | sim | — | [08-dtos-operacao.md §8.13](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/start-inspection.dto.ts` | DTOs de operação | Define o contrato validado StartInspectionDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.14](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/transition-job-card.dto.ts` | DTOs de operação | Define o contrato validado TransitionJobCardDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.15](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/update-appointment-status.dto.ts` | DTOs de operação | Define o contrato validado UpdateAppointmentStatusDto usado nas entradas de agendamentos. | sim | — | [08-dtos-operacao.md §8.16](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/update-appointment.dto.ts` | DTOs de operação | Define o contrato validado UpdateAppointmentDto usado nas entradas de agendamentos. | sim | — | [08-dtos-operacao.md §8.17](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/update-inspection.dto.ts` | DTOs de operação | Define o contrato validado UpdateInspectionDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.18](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/update-job-card.dto.ts` | DTOs de operação | Define o contrato validado UpdateJobCardDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.19](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/update-job-line.dto.ts` | DTOs de operação | Define o contrato validado UpdateJobLineDto usado nas entradas de ordens de serviço. | sim | — | [08-dtos-operacao.md §8.20](08-dtos-operacao.md) |
| `apps/web/src/server/dtos/upsert-answer.dto.ts` | DTOs de operação | Define o contrato validado UpsertAnswerDto usado nas entradas de inspeções. | sim | — | [08-dtos-operacao.md §8.21](08-dtos-operacao.md) |

## 9. DTOs financeiros

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/server/dtos/create-expense.dto.ts` | DTOs financeiros | Define o contrato validado CreateExpenseDto usado nas entradas de despesas. | sim | — | [09-dtos-financeiro.md §9.1](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/create-payment.dto.ts` | DTOs financeiros | Define o contrato validado CreatePaymentDto usado nas entradas de faturas. | sim | — | [09-dtos-financeiro.md §9.2](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/create-purchase.dto.ts` | DTOs financeiros | Define o contrato validado CreatePurchaseItemDto, CreatePurchaseDto usado nas entradas de compras. | sim | — | [09-dtos-financeiro.md §9.3](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/create-quotation.dto.ts` | DTOs financeiros | Define o contrato validado CreateQuotationDto usado nas entradas de orçamentos. | sim | — | [09-dtos-financeiro.md §9.4](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/line-item.dto.ts` | DTOs financeiros | Define o contrato validado CreateLineItemDto, UpdateLineItemDto usado nas entradas de line-item.dto.ts. | sim | — | [09-dtos-financeiro.md §9.5](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/query-expense.dto.ts` | DTOs financeiros | Define o contrato validado QueryExpenseDto usado nas entradas de despesas. | sim | — | [09-dtos-financeiro.md §9.6](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/query-invoice.dto.ts` | DTOs financeiros | Define o contrato validado QueryInvoiceDto usado nas entradas de faturas. | sim | — | [09-dtos-financeiro.md §9.7](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/query-purchase.dto.ts` | DTOs financeiros | Define o contrato validado QueryPurchaseDto usado nas entradas de compras. | sim | — | [09-dtos-financeiro.md §9.8](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/query-quotation.dto.ts` | DTOs financeiros | Define o contrato validado QueryQuotationDto usado nas entradas de orçamentos. | sim | — | [09-dtos-financeiro.md §9.9](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/query-report.dto.ts` | DTOs financeiros | Define o contrato validado QueryReportDto usado nas entradas de relatórios. | sim | — | [09-dtos-financeiro.md §9.10](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/update-expense.dto.ts` | DTOs financeiros | Define o contrato validado UpdateExpenseDto usado nas entradas de despesas. | sim | — | [09-dtos-financeiro.md §9.11](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/update-invoice.dto.ts` | DTOs financeiros | Define o contrato validado UpdateInvoiceDto usado nas entradas de faturas. | sim | — | [09-dtos-financeiro.md §9.12](09-dtos-financeiro.md) |
| `apps/web/src/server/dtos/update-quotation.dto.ts` | DTOs financeiros | Define o contrato validado UpdateQuotationDto usado nas entradas de orçamentos. | sim | — | [09-dtos-financeiro.md §9.13](09-dtos-financeiro.md) |

## 10. Serviços de cadastros e acesso

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/server/services/appointments.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de agendamentos. | sim | — | [10-servicos-cadastros.md §10.1](10-servicos-cadastros.md) |
| `apps/web/src/server/services/branches.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de filiais. | sim | — | [10-servicos-cadastros.md §10.2](10-servicos-cadastros.md) |
| `apps/web/src/server/services/customers.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de clientes. | sim | — | [10-servicos-cadastros.md §10.3](10-servicos-cadastros.md) |
| `apps/web/src/server/services/inspection-templates.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de inspeções. | sim | — | [10-servicos-cadastros.md §10.4](10-servicos-cadastros.md) |
| `apps/web/src/server/services/inspections.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de inspeções. | sim | — | [10-servicos-cadastros.md §10.5](10-servicos-cadastros.md) |
| `apps/web/src/server/services/parts.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de peças. | sim | — | [10-servicos-cadastros.md §10.6](10-servicos-cadastros.md) |
| `apps/web/src/server/services/references.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de references.service.ts. | sim | — | [10-servicos-cadastros.md §10.7](10-servicos-cadastros.md) |
| `apps/web/src/server/services/roles.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de papéis e permissões. | sim | — | [10-servicos-cadastros.md §10.8](10-servicos-cadastros.md) |
| `apps/web/src/server/services/services.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de catálogo de serviços. | sim | — | [10-servicos-cadastros.md §10.9](10-servicos-cadastros.md) |
| `apps/web/src/server/services/suppliers.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de fornecedores. | sim | — | [10-servicos-cadastros.md §10.10](10-servicos-cadastros.md) |
| `apps/web/src/server/services/users.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de usuários/equipe. | sim | — | [10-servicos-cadastros.md §10.11](10-servicos-cadastros.md) |
| `apps/web/src/server/services/vehicles.service.ts` | Serviços de cadastros e acesso | Centraliza regras de negócio e acesso persistente de veículos. | sim | — | [10-servicos-cadastros.md §10.12](10-servicos-cadastros.md) |

## 11. Serviços transacionais

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/server/services/expenses.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de despesas. | sim | — | [11-servicos-transacionais.md §11.1](11-servicos-transacionais.md) |
| `apps/web/src/server/services/invoices.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de faturas. | sim | — | [11-servicos-transacionais.md §11.2](11-servicos-transacionais.md) |
| `apps/web/src/server/services/job-cards.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de ordens de serviço. | sim | — | [11-servicos-transacionais.md §11.3](11-servicos-transacionais.md) |
| `apps/web/src/server/services/line-calculator.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de line-calculator.service.ts. | sim | — | [11-servicos-transacionais.md §11.4](11-servicos-transacionais.md) |
| `apps/web/src/server/services/number-sequence.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de number-sequence.service.ts. | sim | — | [11-servicos-transacionais.md §11.5](11-servicos-transacionais.md) |
| `apps/web/src/server/services/purchases.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de compras. | sim | — | [11-servicos-transacionais.md §11.6](11-servicos-transacionais.md) |
| `apps/web/src/server/services/quotations.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de orçamentos. | sim | — | [11-servicos-transacionais.md §11.7](11-servicos-transacionais.md) |
| `apps/web/src/server/services/reports.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de relatórios. | sim | — | [11-servicos-transacionais.md §11.8](11-servicos-transacionais.md) |
| `apps/web/src/server/services/stock.service.ts` | Serviços transacionais | Centraliza regras de negócio e acesso persistente de stock.service.ts. | sim | — | [11-servicos-transacionais.md §11.9](11-servicos-transacionais.md) |

## 12. API de acesso e cadastros

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/auth/[...all]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de autenticação em `/api/auth/:all*`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.1](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/branches/[id]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de filiais em `/api/branches/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.2](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/branches/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de filiais em `/api/branches`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.3](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/customers/[id]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de clientes em `/api/customers/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.4](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/customers/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de clientes em `/api/customers`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.5](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/health/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de saúde da aplicação em `/api/health`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.6](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/me/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de sessão atual em `/api/me`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.7](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/register/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de provisionamento de oficina em `/api/register`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.8](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/roles/[id]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de papéis e permissões em `/api/roles/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.9](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/roles/permissions/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de papéis e permissões em `/api/roles/permissions`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.10](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/roles/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de papéis e permissões em `/api/roles`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.11](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/users/[id]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de usuários/equipe em `/api/users/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.12](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/users/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de usuários/equipe em `/api/users`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.13](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/vehicles/[id]/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de veículos em `/api/vehicles/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.14](12-api-acesso-e-cadastros.md) |
| `apps/web/src/app/api/vehicles/route.ts` | API de acesso e cadastros | Expõe o contrato HTTP de veículos em `/api/vehicles`, fazendo validação e delegando a regra ao servidor. | sim | — | [12-api-acesso-e-cadastros.md §12.15](12-api-acesso-e-cadastros.md) |

## 13. API de agenda e inspeções

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/appointments/[id]/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de agendamentos em `/api/appointments/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.1](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/appointments/[id]/status/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de agendamentos em `/api/appointments/:id/status`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.2](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/appointments/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de agendamentos em `/api/appointments`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.3](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspection-templates/[id]/publish/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de templates de inspeção em `/api/inspection-templates/:id/publish`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.4](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspection-templates/[id]/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de templates de inspeção em `/api/inspection-templates/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.5](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspection-templates/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de templates de inspeção em `/api/inspection-templates`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.6](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspections/[id]/answers/[questionId]/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de inspeções em `/api/inspections/:id/answers/:questionId`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.7](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspections/[id]/complete/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de inspeções em `/api/inspections/:id/complete`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.8](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspections/[id]/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de inspeções em `/api/inspections/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.9](13-api-agenda-e-inspecoes.md) |
| `apps/web/src/app/api/inspections/route.ts` | API de agenda e inspeções | Expõe o contrato HTTP de inspeções em `/api/inspections`, fazendo validação e delegando a regra ao servidor. | sim | — | [13-api-agenda-e-inspecoes.md §13.10](13-api-agenda-e-inspecoes.md) |

## 14. API de ordens de serviço

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/job-cards/[id]/lines/[lineId]/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id/lines/:lineId`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.1](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/[id]/lines/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id/lines`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.2](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/[id]/mechanics/[userId]/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id/mechanics/:userId`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.3](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/[id]/mechanics/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id/mechanics`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.4](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/[id]/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.5](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/[id]/transition/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards/:id/transition`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.6](14-api-ordens-de-servico.md) |
| `apps/web/src/app/api/job-cards/route.ts` | API de ordens de serviço | Expõe o contrato HTTP de ordens de serviço em `/api/job-cards`, fazendo validação e delegando a regra ao servidor. | sim | — | [14-api-ordens-de-servico.md §14.7](14-api-ordens-de-servico.md) |

## 15. API de catálogos e estoque

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/parts/[id]/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de peças em `/api/parts/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.1](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/parts/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de peças em `/api/parts`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.2](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/services/[id]/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de catálogo de serviços em `/api/services/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.3](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/services/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de catálogo de serviços em `/api/services`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.4](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/stock/balances/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de estoque em `/api/stock/balances`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.5](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/stock/issues/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de estoque em `/api/stock/issues`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.6](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/stock/locations/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de estoque em `/api/stock/locations`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.7](15-api-catalogos-e-estoque.md) |
| `apps/web/src/app/api/stock/movements/route.ts` | API de catálogos e estoque | Expõe o contrato HTTP de estoque em `/api/stock/movements`, fazendo validação e delegando a regra ao servidor. | sim | — | [15-api-catalogos-e-estoque.md §15.8](15-api-catalogos-e-estoque.md) |

## 16. API de fornecedores, compras e despesas

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/expenses/[id]/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de despesas em `/api/expenses/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.1](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/expenses/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de despesas em `/api/expenses`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.2](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/purchases/[id]/cancel/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de compras em `/api/purchases/:id/cancel`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.3](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/purchases/[id]/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de compras em `/api/purchases/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.4](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/purchases/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de compras em `/api/purchases`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.5](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/suppliers/[id]/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de fornecedores em `/api/suppliers/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.6](16-api-compras-e-despesas.md) |
| `apps/web/src/app/api/suppliers/route.ts` | API de fornecedores, compras e despesas | Expõe o contrato HTTP de fornecedores em `/api/suppliers`, fazendo validação e delegando a regra ao servidor. | sim | — | [16-api-compras-e-despesas.md §16.7](16-api-compras-e-despesas.md) |

## 17. API de orçamentos

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/quotations/[id]/approve/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/approve`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.1](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/convert-to-invoice/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/convert-to-invoice`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.2](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/lines/[lineId]/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/lines/:lineId`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.3](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/lines/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/lines`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.4](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/reject/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/reject`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.5](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.6](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/[id]/send/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations/:id/send`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.7](17-api-orcamentos.md) |
| `apps/web/src/app/api/quotations/route.ts` | API de orçamentos | Expõe o contrato HTTP de orçamentos em `/api/quotations`, fazendo validação e delegando a regra ao servidor. | sim | — | [17-api-orcamentos.md §17.8](17-api-orcamentos.md) |

## 18. API de faturas e relatórios

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/src/app/api/invoices/[id]/cancel/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id/cancel`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.1](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/[id]/document/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id/document`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.2](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/[id]/issue/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id/issue`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.3](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/[id]/payments/[paymentId]/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id/payments/:paymentId`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.4](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/[id]/payments/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id/payments`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.5](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/[id]/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/:id`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.6](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/from-job/[jobCardId]/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices/from-job/:jobCardId`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.7](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/invoices/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de faturas em `/api/invoices`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.8](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/reports/financial/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de relatórios em `/api/reports/financial`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.9](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/reports/job-cards/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de relatórios em `/api/reports/job-cards`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.10](18-api-faturas-e-relatorios.md) |
| `apps/web/src/app/api/reports/stock/route.ts` | API de faturas e relatórios | Expõe o contrato HTTP de relatórios em `/api/reports/stock`, fazendo validação e delegando a regra ao servidor. | sim | — | [18-api-faturas-e-relatorios.md §18.11](18-api-faturas-e-relatorios.md) |

## 19. Testes

| Caminho | Camada | Propósito | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `apps/web/test/auth.spec.ts` | Testes | Suíte de integração que verifica auth.spec.ts contra um banco PostgreSQL isolado. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/empty.ts` | Testes | Implementa a responsabilidade de empty.ts na camada testes. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/flows.spec.ts` | Testes | Suíte de integração que verifica flows.spec.ts contra um banco PostgreSQL isolado. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/global-setup.ts` | Testes | Implementa a responsabilidade de global-setup.ts na camada testes. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/helpers.ts` | Testes | Implementa a responsabilidade de helpers.ts na camada testes. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/regressions.spec.ts` | Testes | Suíte de integração que verifica regressions.spec.ts contra um banco PostgreSQL isolado. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
| `apps/web/test/rls.spec.ts` | Testes | Suíte de integração que verifica rls.spec.ts contra um banco PostgreSQL isolado. | não; exceção | arquivo de teste | [19-testes.md §19.1](19-testes.md) |
