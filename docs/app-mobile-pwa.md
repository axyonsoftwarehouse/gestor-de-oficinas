# App da oficina (PWA) e modo Essencial

> Decisão de 2026-11. A operação do dia acontece no **celular**; o site completo
> continua existindo como **back-office do dono**. As duas coisas são a mesma
> base de código e a mesma API.

## Por que PWA antes do app nativo

O Expo + PowerSync continua sendo o destino para offline real e inspeção com
câmera — mas ele exige reimplementar autenticação, telas e regras que já existem
no web. Antes de pagar esse custo, o PWA valida a hipótese que importa:

> A oficina pequena abre, orça e recebe uma OS em menos de 60 segundos, com uma
> mão, sem treinamento.

Se o PWA falhar nisso, o problema é o fluxo — e trocar de tecnologia não resolve.
Se ele passar, o nativo herda um produto validado.

## O modo Essencial

`Tenant.plan` decide **o que aparece no menu**, não o que é permitido. A
autorização continua no RBAC e no `runRoute`, no servidor.

| Plano | Features visíveis |
| --- | --- |
| `essencial` | dashboard, job_card, quotation, invoice, payment, customer, vehicle, service |
| `completo` | todas as features do catálogo |

Regras:

- Plano nulo, `trial` ou desconhecido resolve para **completo** (comportamento legado).
- Novas oficinas são provisionadas como `essencial` (`server/auth/provision.ts`).
- O dono alterna no menu do usuário → **Ativar modo completo / Usar modo essencial**.
- `PATCH /api/tenant/plan` exige `setting.edit`.
- Quem não é owner não vê o atalho.

Implementação: `packages/shared/src/plans.ts`, `lib/permissions.ts`
(`canUseFeature`), `components/app-shell.tsx`, `app/api/me/route.ts`.

## Rotas do app

Tudo dentro do route group `app/(mobile)` — layout próprio, sem a sidebar do
back-office.

| Rota | O que faz |
| --- | --- |
| `/m/hoje` | OS abertas por estágio (aprovação, na oficina, prontas) + total em serviço |
| `/m/os/nova` | placa → veículo (busca ou cadastro rápido) → serviços do catálogo → abre a OS |
| `/m/os/[id]` | status em botões grandes, linhas, telefone do cliente, faturar |
| `/m/caixa` | faturas em aberto e saldo a receber |
| `/m/caixa/[id]` | recebe o saldo com a forma de pagamento |

A navegação é uma barra inferior de três posições: **Hoje**, **Nova OS**
(botão central) e **Caixa**. Nada de menu lateral, nada de modal.

## Entrada pelo celular

`middleware.ts` detecta user-agent móvel e manda a navegação para `/m/hoje`.

- `?desktop=1` grava o cookie `gestor_view=desktop` e devolve o site completo.
- `?desktop=0` volta para o app (usado pelo atalho "Abrir no celular").
- `/o/*` fica público: é o futuro link de orçamento aprovado pelo cliente.
- `/api/*` nunca é redirecionado.

## PWA

- `app/manifest.ts` gera `/manifest.webmanifest` (`start_url: /m/hoje`,
  `display: standalone`).
- `public/icon.svg` é o ícone (vetor, nítido em qualquer densidade).
- `viewport` no `layout.tsx` usa `viewportFit: cover` para a área segura do iPhone.
- Instalação: abrir no Chrome/Safari → "Adicionar à tela inicial".

Limitação conhecida: lojas (Play/App Store) exigem PNG 192/512. Fica para a fase
do app nativo.

## Recebimento

`GET /api/payment-methods` lista as formas ativas da oficina (o seed cria
Dinheiro, Pix, Cartão etc.). O pagamento usa `POST /api/invoices/:id/payments`
com `amount` e `methodId`.

## O que ainda falta (em ordem)

1. **Link público do orçamento** (`/o/[token]`) com aprovar/recusar — fecha o
   ciclo de valor já na primeira sessão.
2. **Catálogo de modelos de veículo** exposto na API: hoje o cadastro rápido
   grava placa e ano, sem marca/modelo.
3. **Offline de verdade**: fila local de mutações no PWA; depois PowerSync + Expo.
4. **Onboarding de primeira OS**: importar contatos do WhatsApp/caderno.
5. **Impressão/etiqueta** e **lembrete de revisão** por WhatsApp.

## Como testar

```bash
pnpm --filter @gestor/shared build
pnpm --filter @gestor/web dev
```

- Desktop: http://localhost:3000 → back-office.
- App: http://localhost:3000/m/hoje (funciona no desktop para depuração).
- Trocar de plano: menu do usuário (canto superior direito).
- Testes unitários do plano: `pnpm --filter @gestor/web test plans`.
