# 7. Glossário

| Termo | Significado |
|---|---|
| **Tenant** | Empresa/oficina que delimita dados, usuários e permissões. |
| **Filial** | Unidade operacional pertencente ao tenant. |
| **OS / Job Card** | Ordem de serviço unificada para inspeção, reparo ou serviço. |
| **RLS** | Row Level Security do PostgreSQL; impede que uma conexão de aplicação veja linhas de outro tenant. |
| **RBAC** | Controle de acesso baseado em papéis e permissões. |
| **Membership** | Vínculo de um usuário global com um tenant. |
| **Ledger** | Livro-razão de movimentos; no estoque, é a fonte do saldo. |
| **Baixa para OS** | Saída de peça do estoque vinculada a uma ordem de serviço. |
| **Template de inspeção** | Modelo versionado de seções e perguntas que origina uma inspeção. |
| **Publicação** | Congelamento de uma versão de template para uso operacional. |
| **Gate de faturamento** | Pré-condição que impede faturar antes da aprovação exigida. |
| **Orçamento** | Proposta de itens/valores que pode ser enviada, aprovada, rejeitada e convertida. |
| **Fatura** | Documento financeiro emitido, pago parcial/totalmente ou cancelado. |
| **Soft delete** | Exclusão lógica por data/flag, preservando histórico. |
| **Sequência documental** | Contador por tenant usado para números de OS, orçamento, fatura e compra. |
| **DTO** | Objeto que define e valida a entrada de uma rota. |
| **Service** | Camada que aplica regras de negócio e acessa a persistência. |
| **Route Handler** | Endpoint HTTP do App Router do Next.js. |
| **Pooled URL** | Conexão PostgreSQL por pool, adequada ao runtime serverless. |
| **Direct URL** | Conexão direta usada por migrations e administração. |
| **NOBYPASSRLS** | Propriedade do papel PostgreSQL que o obriga a respeitar políticas RLS. |
| **PowerSync** | Tecnologia escolhida para sincronizar PostgreSQL e SQLite no mobile offline. |
