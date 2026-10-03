# Referência de Layout — FinTrust UI Kit

> Análise do kit `FinTrust - Finance Management Ui Kit - v1.0` para inspirar o layout do
> **Gestor de Oficinas**. Fonte: exports do Figma em PNG/SVG (Light, Dark, Mobile e Design
> System) + arquivo `.fig`. Paleta extraída diretamente dos SVGs.

---

## 1. Visão geral

UI kit de gestão financeira com estética **clean, clara e "SaaS moderna"**: fundo branco,
muito espaço em branco, cantos arredondados, sombras sutis, azul como cor de ação e verde
como cor de destaque positivo. Tem variantes **Light**, **Dark** e **Mobile Responsive**,
além de um **Design System** de componentes.

Telas observadas: Dashboard, Cards, Invoices, Transaction, Statistics, Investment,
Settings, Sign In, Account, Spending, Earning.

---

## 2. Design tokens

### Cores (documentadas no UI kit)
| Token | Hex | Uso |
|---|---|---|
| Primary | `#2F80ED` | Ações, links, nav ativa |
| Secondary | `#4CE364` | Destaque positivo, séries de gráfico |
| Success | `#12B76A` | Status positivo |
| Yellow | `#F2C94C` | Alertas, séries |
| Error | `#EB5757` | Erros, status negativo |
| Text Primary | `#23262F` | Títulos e texto forte |
| Text Secondary | `#B1B5C3` | Texto de apoio |
| Grey | `#353945` | Texto intermediário |
| White | `#FFFFFF` | Superfícies |

### Cores (observadas nos SVGs — o que foi de fato desenhado)
- Texto/títulos: **`#233145`** (navy escuro) · texto mutado: **`#8E98A7`**
- Azul primário: **`#3183FF`** (hover/variações `#2975E8`, `#0177FB`)
- Verde/lime secundário: **`#ABE85F`** (verde de gráfico `#8AD033`)
- Fundos: **`#F6F7FB`** (página/thead), `#EAF0F8`, `#F8F9FC`, `#FAFAFA`
- Borda: **`#DFE5F1`**
- Status: erro `#FF5252` (claro `#FE8C8C`, fundo `#FFD7D7`/`#FFF3F3`), amarelo `#EDD92A`
  (fundo `#FDFFF0`), verde `#8AD033` (fundo `#ECFCE4`/`#F6FFF1`)
- Acentos de séries: laranja `#FFAD31`, teal `#1FD4C0`, roxo `#7D6FC4`, rosa `#F085A9`

> Para os tokens do projeto, adotar a paleta documentada (azul `#2F80ED` / verde `#4CE364`),
> ciente de que os SVGs renderizam o azul como ~`#3183FF`.

### Tipografia
- Família: **SF Pro Display** (Apple). Alternativa livre recomendada: **Inter**.
- Escala observada: 24/20 (títulos), 16, 14 (corpo/botão), 12 (apoio). Pesos Medium e Regular.

### Formas e elevação
- Raio: **8–12 px** (cards ~12, inputs/botões ~8, pills totalmente arredondadas).
- Sombras: muito sutis (cards com borda `#DFE5F1` e leve sombra).
- Ícones: lineares, traço 1.5–2, tamanhos 16/20/24.

---

## 3. Layout (estrutura recorrente)

```
┌───────────┬─────────────────────────────────────────────────────────────┐
│  Sidebar  │  Topbar: busca (⌘F) · notificações · avatar + nome/e-mail     │
│  (branca) ├─────────────────────────────────────────────────────────────┤
│  logo     │  Título + subtítulo ("See your activities – data")  [ações]  │
│  nav      │  ┌ KPI ┐ ┌ KPI ┐ ┌ KPI ┐ ┌ KPI ┐                            │
│  ...      │  ┌ gráfico ─────────────┐ ┌ gráfico ──────────┐            │
│  divisor  │  ┌ tabela ──────────────────────────────────────┐           │
│  Settings │                                                             │
│  Help     │                                                             │
│  Log Out  │                                                             │
└───────────┴─────────────────────────────────────────────────────────────┘
```

- **Sidebar** branca, larga (~230px), item ativo = **pílula azul sólida com texto branco**;
  ícones à esquerda; seção inferior (Settings/Help/Log Out) separada por divisor.
- **Topbar** com busca à esquerda e perfil à direita.
- **Cabeçalho de página**: título forte + subtítulo mutado; ações à direita
  (outline "Filter by" + primário "Exports" com chevron).
- **Grid de KPIs** (4 colunas), cada card com rótulo, valor grande, barra colorida e
  **badge de variação** (▲ +2.58% verde/vermelho).
- **Gráficos**: barras (azul+verde) com toggle Week/Month/Year; área com dropdown Month.
- **Tabelas**: cabeçalho em `#F6F7FB`, linhas com divisórias claras, **avatar + nome**,
  valor em **pílula** clara, **status pill** (Paid verde / Unpaid amarelo / Due vermelho),
  coluna de ações (editar/excluir/“kebab”). Cabeçalho da seção com link “View all”.
- **Settings**: abas laterais à esquerda (General, Notification, Account, Bill Payment,
  Payment Access, Language, Change Password) + formulário em grid 2 colunas, campos com
  ícone de check verde quando válidos.
- **Statistics**: lista “Most Spent” com ícone, valor e barra de progresso colorida;
  donut “Analytics” com legenda.

---

## 4. Componentes notáveis

- **Botões**: primário azul sólido; secundário outline; botões de ação com ícone (Filter, Exports).
- **Inputs**: borda clara, cantos 8px, label acima; estados de validação com check azul/verde.
- **Cards de crédito**: gradiente azul (primário) e versão clara, com bandeira (VISA).
- **KPI cards**: número grande + barras + delta.
- **Status pills** e **badges** claros com texto colorido.
- **Avatares** circulares em listas/tabelas.
- **Charts**: área com gradiente, barras agrupadas, donut com centro de total.
- **Login/Sign In**: minimalista, fundo claro, título grande.

---

## 5. Como aplicar no Gestor de Oficinas

### Tema (Tailwind)
Criar tokens no `tailwind.config.ts`:
```ts
colors: {
  brand:  { DEFAULT: '#2F80ED', dark: '#2975E8' },
  accent: { DEFAULT: '#4CE364', lime: '#ABE85F' },
  ink:    { DEFAULT: '#233145', muted: '#8E98A7', soft: '#B1B5C3' },
  surface:{ DEFAULT: '#FFFFFF', page: '#F6F7FB', line: '#DFE5F1' },
  state:  { success: '#12B76A', warning: '#F2C94C', danger: '#EB5757' },
}
```
- Fonte **Inter** via `next/font`; pesos 400/500/600/700.
- Ícones: **lucide-react** (lineares, batem com o kit).
- Gráficos: **Recharts** (área, barras, donut) — casa com o visual.

### Mapeamento por tela
| Kit | Gestor de Oficinas |
|---|---|
| Sidebar + Topbar | `AppShell` (já existe) — trocar cores/pílula ativa |
| Dashboard (KPIs + charts) | `dashboard` — KPIs de faturado/recebido/despesas/líquido + bar/área |
| Invoices | `invoices` (resumo All/Paid/Unpaid/Overdue + tabela com pills) |
| Cards/Transaction | `job-cards` / `stock` (lista + ação rápida) |
| Settings (abas) | `team`/`roles`/`branches` ou um `/settings` futuro |
| Statistics (Most Spent) | `reports`/`stock` (top peças/serviços + donut) |
| Sign In | `login` |

### Adaptações (não copiar cegamente)
- Traduzir o vocabulário financeiro para **oficina** (OS, orçamentos, peças, inspeções).
- O azul/verde do kit funciona bem; usar as **pills de status** para os status reais
  (DRAFT/IN_PROGRESS/COMPLETED etc.).
- A sidebar do kit é mais larga/espalhada; manter densidade adequada a muitas telas.
- Dark mode existe no kit — ótimo para um tema futuro, mas fora do escopo inicial.

---

## 6. Resumo do que adotar

1. Paleta azul + verde, texto navy, fundo `#F6F7FB`, borda `#DFE5F1`.
2. Sidebar com pílula ativa azul; topbar com busca e perfil.
3. KPIs com valor grande + barra + badge de variação.
4. Tabelas com avatar, status pill colorida e ações com ícone.
5. Cards de seção com título + link/ação à direita.
6. Gráficos de área/barra/donut com a paleta do kit.
7. Fontes/ícones: Inter + lucide-react; gráficos: Recharts.
