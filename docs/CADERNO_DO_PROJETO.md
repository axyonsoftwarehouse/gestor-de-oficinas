# Caderno do Projeto: Gestor de Oficinas

> Mantido à mão. Complementa o [Mapa do Projeto](MAPA_DO_PROJETO.md) §Índice, que descreve o código.
> Última atualização: 17/10/2026 · Regra deste arquivo: nada aqui é gerado; entrada antiga não se apaga, se supera.

## 0. Como ler este caderno

Este documento registra decisões, regras aprendidas, problemas duradouros e próximos passos. A descrição de arquivos, rotas, tabelas e execução fica no mapa. Quando uma entrada deixar de valer, ela permanece riscada e recebe data e motivo da superação.

## 1. Identificação

- **Projeto:** Gestor de Oficinas — SaaS multiempresa para oficinas automotivas.
- **Repositório:** https://github.com/axyonsoftwarehouse/gestor-de-oficinas
- **Produção:** https://gestor-de-oficinas.vercel.app
- **Versão atual:** pré-1.0; pacotes em `0.0.0` e sem tags Git em 09/10/2026.
- **Stack:** Next.js full stack, React, PostgreSQL/Neon, Prisma, Better Auth, pnpm e Turborepo.

## 2. Estado em uma tela

Em 09/10/2026, painel web e API estão publicados na Vercel com banco Neon. O núcleo operacional está implementado: cadastros, agenda, inspeções, OS, orçamentos, faturas, pagamentos, estoque, compras, despesas, relatórios, usuários e papéis. O catálogo de serviços e as ações operacionais que faltavam nas telas foram concluídos em 08/10/2026. RLS, fluxos de negócio, autenticação, typecheck e build têm verificação automatizada. O aplicativo mobile ainda é um esqueleto. Anexos, notas, campos customizados, PDF headless, billing, onboarding, notificações e observabilidade ainda não foram implementados. Backups offsite e rotação de segredos permanecem prioridades operacionais; a automação e o runbook foram preparados em 17/10/2026, mas o risco só fecha após configurar bucket/secrets, executar o primeiro backup e o drill de restauração. Estado técnico detalhado: [funcionalidades](mapa/03-funcionalidades.md) §3 e [problemas](mapa/06-problemas-e-dividas.md) §6.

## 3. Decisões fechadas

| Data | Decisão | Por quê | Descartado |
|---|---|---|---|
| 03/10/2026 | Monorepo Node/TypeScript com pnpm e Turborepo | Compartilhar contratos e coordenar build/testes | Repositórios separados |
| 03/10/2026 | Next.js full stack na Vercel | Um deploy e mesma origem para tela/API | API NestJS separada; removida na migração |
| 03/10/2026 | PostgreSQL Neon com Prisma | Banco relacional gerenciado e modelo tipado | Supabase/Cloudflare como plataforma principal |
| 03/10/2026 | Schema compartilhado com `tenant_id` e RLS | Isolamento forte e auditável por oficina | Banco/schema separado por tenant |
| 03/10/2026 | Papel de runtime sem `BYPASSRLS` | Obrigar a aplicação a respeitar as políticas | Runtime com credencial administrativa |
| 03/10/2026 | Better Auth com cookie de sessão | Integrar autenticação ao Next.js e retirar JWT próprio | Auth JWT/refresh da API antiga |
| 03/10/2026 | RBAC normalizado por papéis e permissões | Permitir composição por tenant | Papéis fixos no código como única fonte |
| 03/10/2026 | OS unificada para inspeção, reparo e serviço | Evitar agregados duplicados e fluxos divergentes | Uma entidade por tipo de atendimento |
| 03/10/2026 | Inspeções versionadas e aprovação como gate | Preservar o checklist executado e impedir faturamento prematuro | Editar versão publicada |
| 03/10/2026 | Estoque por ledger de movimentos | Manter rastreabilidade e permitir reversões | Saldo isolado como fonte da verdade |
| 03/10/2026 | Dinheiro `Decimal(14,2)`, quantidade `Decimal(14,3)` e impostos por linha | Evitar erro de ponto flutuante e preservar cálculo fiscal | `number/float` como persistência financeira |
| 03/10/2026 | PowerSync para o futuro mobile offline-first | Sincronizar PostgreSQL e SQLite com estratégia explícita | Offline artesanal sem motor de sync |
| 03/10/2026 | Serviço headless HTML→PDF | Suportar A4, recibo e etiquetas fora do limite do app principal | Gerar PDF complexo dentro das rotas comuns |
| 03/10/2026 | Portal do cliente por token expirável | Aprovação, acompanhamento e assinatura sem criar conta obrigatória | Exigir usuário permanente para cada cliente |
| 03/10/2026 | Visual inspirado no FinTrust, sem cópia literal | Obter consistência visual adaptada ao domínio | Replicar o kit sem adaptação |

## 4. Regras de desenvolvimento

### 4.1 Técnicas (armadilhas do stack)

**Regra 1 — Contexto de tenant obrigatório (03/10/2026).** Toda requisição de negócio executa em transação curta com o tenant corrente. Evita consulta sem escopo e vazamento entre oficinas.

**Regra 2 — Runtime nunca ignora RLS (03/10/2026).** A aplicação usa papel NOBYPASSRLS; credencial direta fica restrita a migrations/administração. Evita que um erro no filtro da aplicação exponha outro tenant.

**Regra 3 — Prisma somente em Node.js (03/10/2026).** Middleware Edge não toca Prisma. Evita incompatibilidade de runtime e conexões indevidas.

**Regra 4 — Variável de build entra no Turbo (03/10/2026).** Toda variável necessária ao build deve estar declarada no ambiente estrito do Turborepo. Evita o incidente em que o segredo do Better Auth desapareceu durante o build.

**Regra 5 — Transações serverless curtas (03/10/2026).** Evitar trabalho externo/lento dentro de transação. Reduz timeout e contenção na Vercel/Neon.

**Regra 6 — Banco de teste dedicado (08/10/2026).** Integração nunca usa banco de desenvolvimento ou produção; o setup reaplica migrations, papel e RLS. Evita perda de dados e falso positivo sem políticas reais.

**Regra 7 — Mudança de banco inclui segurança (03/10/2026).** Nova tabela multi-tenant exige migration, RLS, privilégios e teste. Evita schema funcional, porém exposto.

**Regra 8 — Segredos não entram em código/documentação (03/10/2026).** Somente nomes e exemplos neutros. Evita vazamento por Git, log ou handoff.

### 4.2 Código e estilo

**Regra 9 — Rota fina, service forte (03/10/2026).** A rota autentica, autoriza e valida; o service contém a regra. Evita duplicação entre endpoints.

**Regra 10 — Entrada externa sempre validada (03/10/2026).** DTO/schema rejeita tipo, limite e campo desconhecido. Evita massa inválida e atribuição indevida.

**Regra 11 — Histórico é preservado quando importa (03/10/2026).** Preferir soft delete ou cancelamento/reversão em agregados auditáveis. Evita apagar a explicação financeira/operacional.

**Regra 12 — Numeração é transacional e por tenant (03/10/2026).** Evita colisão em execução concorrente.

**Regra 13 — Gate de qualidade antes de commit (03/10/2026).** Rodar typecheck; build ao mexer em rotas; testes ao mexer em fluxo. Evita regressão descoberta só no deploy.

**Regra 14 — Commits descritivos (03/10/2026).** Usar `feat`, `fix`, `chore` e `docs`, com escopo quando útil. Facilita retomada e changelog.

### 4.3 Negócio

**Regra 15 — Estado muda apenas por transição válida (03/10/2026).** OS, orçamento, inspeção, compra e fatura obedecem a regras do servidor. Evita combinações impossíveis.

**Regra 16 — Versão publicada é imutável (03/10/2026).** Alteração de checklist gera nova versão. Preserva o significado de inspeções históricas.

**Regra 17 — Faturamento respeita aprovação (03/10/2026).** Quando a inspeção/orçamento exigir aprovação, a fatura não pode contornar o gate. Evita cobrança não autorizada.

**Regra 18 — Movimento de estoque não some (03/10/2026).** Correção é feita por reversão/novo movimento. Mantém auditoria do saldo.

**Regra 19 — Valores derivados são recalculados no servidor (03/10/2026).** Base, impostos, totais e saldo não dependem do valor enviado pela tela. Evita manipulação e divergência.

## 5. Problemas conhecidos e soluções

| Data | Problema | Causa real | Solução | Situação |
|---|---|---|---|---|
| 03/10/2026 | Build sem segredo de autenticação | Modo estrito do Turbo removia variável não declarada | Declarar variáveis globais necessárias | resolvido |
| 03/10/2026 | Duas APIs concorrentes | Migração de NestJS para Route Handlers incompleta | Remover a API NestJS e consolidar no Next.js | resolvido |
| 08/10/2026 | Teste local dependia de infraestrutura externa | Não havia PostgreSQL local simples/isolado | PostgreSQL portátil controlado por script | resolvido |
| 08/10/2026 | Catálogo de serviços existia só no modelo | API e interface faltavam | API, tela e integração com OS/orçamento | resolvido |
| 09/10/2026 | Neon gratuito sem backup agendado | Limitação do plano | Definir e automatizar dump offsite | aberto, P0; workflow e runbook preparados em 17/10, falta configurar bucket/secrets e fazer o drill |
| 09/10/2026 | Segredos de desenvolvimento precisam de rotação | Credenciais circularam durante configuração | Rotacionar Neon e papel de aplicação | aberto, P0; gerador e procedimento preparados em 17/10, falta executar |
| 09/10/2026 | Rate limit não é global no serverless | Estado em memória por instância | Escolher armazenamento compartilhado | aberto |
| 09/10/2026 | Credenciais demo visíveis | Conveniência de desenvolvimento | Remover/condicionar antes do uso comercial | aberto |
| 09/10/2026 | Defesa Prisma depende de lista manual | Registro de modelos multi-tenant não é derivado do schema | Automatizar/verificar lista; manter RLS como garantia | aberto |
| 09/10/2026 | Campo/modelo legado de senha/token | Migração para Better Auth | Confirmar ausência de uso e remover por migration futura | aberto |

## 6. Fases e versões

| Versão/fase | Data | O que entrou |
|---|---|---|
| Fundação | 03/10/2026 | Monorepo, domínio, banco e módulos iniciais |
| Migração full stack | 03/10/2026 | Next.js, Better Auth, Neon, RLS e retirada do NestJS |
| Hardening e produção | 03–06/10/2026 | Headers, CI, testes e deploy Vercel/Neon |
| Ambiente de testes e documentação | 08/10/2026 | PostgreSQL portátil e primeiro mapa |
| Fechamento operacional web | 08/10/2026 | Despesas, fornecedores, catálogo de serviços e ações ausentes nas telas |
| Versão comercial | aberta em 09/10/2026 | Ainda sem número, critérios comerciais ou tag |

## 7. Próximos passos

1. **Backups offsite e rotação de segredos.** Automação (dump cifrado diário) e runbook prontos em `docs/backups-e-rotacao.md`; falta escolher/configurar o bucket, gravar os secrets, rodar o primeiro backup, fazer o drill de restauração e rotacionar as credenciais.
2. **Observabilidade, alertas e runbook de incidentes.** Necessário antes de ampliar clientes; depende de ferramenta e política de logs.
3. **Anexos e notas.** Fechar lacuna operacional; depende de storage e retenção.
4. **Serviço de PDF headless.** Transformar o HTML existente em A4/recibo; depende da infraestrutura escolhida.
5. **Aplicativo mobile offline-first.** Entregar o fluxo do mecânico; depende de escopo e implantação do PowerSync.
6. **Billing, planos, limites e onboarding.** Transformar o sistema em SaaS autoatendido; depende do modelo comercial.
7. **Notificações e lembretes.** Depende de provedores e regras de consentimento/frequência.
8. **Campos customizados.** Expor o schema já previsto em API e UI.
9. **Impressão, QR/barcode e refinamento de relatórios/interface.** Evolução posterior ao núcleo e à operação segura.

## 8. Glossário de domínio

- **Tenant:** empresa/oficina que isola dados e acesso.
- **OS / Job Card:** ordem de serviço unificada.
- **Gate:** pré-condição obrigatória antes de uma transição, como aprovação antes do faturamento.
- **Ledger:** histórico imutável de movimentos que produz o saldo.
- **Baixa para OS:** saída de uma peça do estoque vinculada a uma ordem.
- **Template publicado:** versão congelada do checklist usada em inspeções.
- **Soft delete:** exclusão lógica que mantém o histórico.
- **Owner:** proprietário inicial do tenant, com acesso administrativo.

## 9. Perguntas abertas

| Desde | Pergunta | O que falta para decidir | Quem decide |
|---|---|---|---|
| 09/10/2026 | Qual provedor de bucket, retenção final e responsável pela chave de backup? | Custo, RPO/RTO, local de armazenamento e escrow da chave | Werner/produto |
| 09/10/2026 | A rotação das credenciais do Neon e do papel da aplicação já ocorreu? | Confirmação operacional e data | Werner/operação |
| 09/10/2026 | Qual provedor e política de retenção para anexos, fotos e laudos? | Volume, custo, LGPD e expurgo | Werner/produto |
| 09/10/2026 | Qual modelo comercial, planos, limites e provedor de billing? | Estratégia de preço e cobrança | Werner/produto |
| 09/10/2026 | Quais provedores serão usados para e-mail e SMS? | País, custo, entregabilidade e consentimento | Werner/produto |

## 10. Histórico deste caderno

| Data | O que mudou |
|---|---|
| 09/10/2026 | Criação inicial a partir do histórico Git, documentação existente e estado do projeto no commit `83ac90f`. |
| 17/10/2026 | Revisão de links, citações por seção e contagens do mapa antes do commit; sem alteração de código. |
| 17/10/2026 | Automação de backup cifrado (workflow diário, scripts de dump/restauração) e procedimento de rotação de segredos; risco segue aberto até configurar bucket/secrets e concluir o drill. |
