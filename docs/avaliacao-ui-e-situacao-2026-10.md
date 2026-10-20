# Avaliação da UI e situação do projeto — 19/10/2026

> Levantamento feito rodando o web localmente (porta 3010, banco Neon, só leitura) e
> lendo `apps/web/src`. Complementa o [Caderno](CADERNO_DO_PROJETO.md) e o
> [Mapa](MAPA_DO_PROJETO.md); não os substitui.

## 1. Situação geral em uma tela

| Área | Estado | Observação |
|---|---|---|
| Backend/API | **Sólido** | 60+ Route Handlers, services por módulo, RLS + papel NOBYPASSRLS, DTOs validados |
| Typecheck | Verde | `pnpm typecheck` ok |
| CI | Verde | últimas 5 execuções com sucesso (até 09/10) |
| Git | 2 commits locais **não enviados** + 6 arquivos modificados (backup/rotação) | `main...origin/main [ahead 2]` |
| Testes | Só Node (rls, flows, auth, regressions) | Nenhum teste de UI/componente |
| Frontend | **Funcional, mas cru** | 24 telas, ~6 mil linhas; parece um "admin gerado", não um produto |
| Mobile | Esqueleto Expo | sem fluxo |
| Dados demo no Neon | Oficina demo **vazia** | dashboard todo em R$ 0,00; difícil avaliar/demonstrar |
| Ops | Backup offsite e rotação de segredos preparados, **não executados** | P0 do caderno |

Conclusão: a base técnica (dados, segurança, domínio) está boa. O ponto fraco é a camada
de interface — e é ela que o cliente vê. A recomendação é parar de adicionar módulos
e fazer uma rodada de **fundação de UI** antes de seguir o backlog.

## 2. Avaliação da UI

### 2.1 O que está bom
- Tokens de cor em CSS variables com light/dark funcionando (o dark está bonito).
- Primitivas mínimas em `components/ui.tsx` (Button, Input, Card, Badge, Modal, Th/Td).
- Visual limpo e consistente entre listas; tipografia Inter; ícones lucide.
- React Query bem usado para cache/invalidação.

### 2.2 Problemas críticos (quebram uso real)

1. **Mobile sem navegação.** A sidebar é `hidden md:flex` e não existe menu hambúrguer:
   em celular/tablet estreito o usuário não consegue sair da tela atual
   (`components/app-shell.tsx:61`). Para oficina (balcão, pátio) isso é grave.
2. **Erro de API vira "lista vazia".** Nenhuma tela lê `isError`/`error` do `useQuery`.
   Se a API falhar, o usuário vê "Nenhum cliente encontrado" ou "R$ 0,00" — dado falso.
   Reproduzido nesta avaliação.
3. **Sem paginação na interface.** As listas pedem só a primeira página (`pageSize`
   padrão do backend, máx. 100) e não há controles de página: com volume real, registros
   simplesmente "somem".
4. **Status e enums crus na tela.** `IN_PROGRESS`, `WAITING_APPROVAL`, `PAID`, `LABOR`
   aparecem em inglês e maiúsculas em OS, faturas, orçamentos, inspeções, agendamentos
   e compras (12 ocorrências; ex.: `job-cards/[id]/page.tsx:158` e os botões de transição
   em `:277`). O mapa de rótulos existe só no dashboard (`dashboard/page.tsx:30`).

### 2.3 Problemas de usabilidade

5. **Busca global decorativa** — o campo "Buscar…" do topo não faz nada; o sino de
   notificações mostra bolinha vermelha fixa sem função; o avatar tem `ChevronDown` sem menu.
   Elementos falsos minam a confiança.
6. **Menu plano com 18 itens** sem agrupamento e sem respeitar permissões (um mecânico vê
   "Papéis", "Despesas" etc. e toma 403). Sugestão de grupos: *Operação* (Agenda, OS,
   Inspeções, Orçamentos, Faturas), *Cadastros* (Clientes, Veículos, Serviços, Peças,
   Fornecedores), *Estoque & compras*, *Financeiro* (Despesas, Relatórios),
   *Configurações* (Filiais, Equipe, Papéis, Checklists).
7. **Sem feedback de ações** — não há toasts; salvar/excluir/transicionar não confirma
   sucesso. Exclusão usa `window.confirm` nativo (11 telas).
8. **Modal**: não fecha com Esc nem clicando fora, sem foco inicial/trap, formulários não
   são `<form>` (Enter não envia — só o login tem `onSubmit`).
9. **Tela da OS (`job-cards/[id]`)**, a mais importante do produto, é a mais fraca:
   cabeçalho só com número/placa, sem dados do cliente/veículo/km/datas; histórico em
   texto miúdo com enums; transições como botões genéricos; remover item sem confirmação.
10. **Dashboard sem período** — KPIs sem filtro de data/comparação; "Atalhos" é uma lista
    de links que duplica o menu; nada acionável do dia (OS atrasadas, agenda de hoje,
    faturas a receber).
11. **Formulários sem máscara/validação** — CPF/CNPJ, telefone, CEP, placa, dinheiro são
    texto livre; valores numéricos em `type=number` sem formatação BRL.
12. **Tabelas** sem ordenação, sem clique na linha para abrir detalhe, ações "Editar /
    Excluir" em botões grandes repetidos em toda linha.
13. **Credenciais demo** pré-preenchidas e exibidas no login (`login/page.tsx:13`).

### 2.4 Problemas de código da UI (dívida)

- **Toda página é um componente monolítico** de 150–350 linhas com query, mutations,
  estado de formulário, tabela e modal juntos; padrão CRUD copiado ~15 vezes.
- **Duas linguagens de cor**: tokens (`ink`, `surface`) + 112 usos de `slate-*`
  remapeado + cores cruas (`text-red-600`, `bg-emerald-600`…) que fogem do tema.
- **Tipos de rótulo/tom de status** reimplementados por página (`tone()`, `statusTone()`).
- Acessibilidade mínima: 2 `aria-label` no projeto todo; botão de fechar é "✕" em texto.
- Sem biblioteca de componentes headless (Radix/shadcn), sem lib de formulário
  (react-hook-form + zod), sem testes de componente.
- Obs.: o item do mapa "fonte remota conflita com a CSP" parece **não proceder** —
  a CSP já libera `fonts.googleapis.com` e `fonts.gstatic.com` (`next.config.mjs`).
  Melhor ainda: trocar por `next/font` e remover a dependência externa.

## 3. Proposta de plano (ordem sugerida)

**Fase A — Fundação de UI (1ª prioridade)**
1. Adotar **shadcn/ui (Radix)** sobre os tokens atuais: Dialog, DropdownMenu, Sheet,
   Toast (sonner), Tooltip, Command — resolve modal/Esc/foco, menu do usuário, toasts.
2. `AppShell` novo: sidebar agrupada e recolhível, **Sheet no mobile**, menu filtrado
   por `session.permissions`, breadcrumb, busca global real (Command ⌘K) ou removê-la.
3. Componente **`DataTable`** (TanStack Table): paginação server-side, ordenação,
   estados loading/vazio/**erro**, linha clicável, menu de ações por linha.
4. `lib/labels.ts` único com rótulos PT-BR e tons para todos os enums + `<StatusBadge>`.
5. Formulários com **react-hook-form + zod** e inputs com máscara (CPF/CNPJ, tel, CEP,
   placa, moeda BRL); `<ConfirmDialog>` no lugar de `window.confirm`.
6. Unificar cores em tokens (eliminar `slate-*` e cores cruas); `next/font` para Inter.

**Fase B — Telas que importam**
7. Redesenho da **OS** (cabeçalho rico, timeline de status, itens com totais, ações
   contextuais) e do **Dashboard** (período, "hoje": agenda, OS em andamento/atrasadas,
   a receber).
8. Migrar as telas CRUD para o padrão novo (podem ir em paralelo depois de A).

**Fase C — Base para continuar**
9. `db:seed:mock` em um ambiente de staging/preview para demonstração (não no banco de produção).
10. Testes de componente (Vitest + Testing Library) e um smoke E2E (Playwright) do fluxo
    OS → orçamento → fatura.
11. Fechar os P0 de ops (push dos commits pendentes, primeiro backup + drill, rotação).
