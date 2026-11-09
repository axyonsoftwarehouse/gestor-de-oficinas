# PWA offline

> O que funciona sem internet hoje, como funciona e o que ainda falta.

## O que dá para fazer offline

- Abrir o app (`/m/hoje`) e navegar entre as telas já visitadas.
- Ver OS, faturas, clientes, veículos e serviços com os **últimos dados
  sincronizados** (até 24h).
- Continuar logado, sem ser expulso para o login.
- Disparar operações: elas ficam **pausadas** e são enviadas quando a conexão
  volta — desde que o app continue aberto.

## Como funciona

### 1. Service worker (`apps/web/public/sw.js`)

| Requisição | Estratégia |
| --- | --- |
| Navegação (HTML) | network-first → cache da última visita → `/offline` |
| `/_next/static/*`, ícone, manifest | cache-first |
| `/api/*` | **passa direto** (ver abaixo) |

O SW é registrado só em produção (`ServiceWorkerRegistrar`). Em dev ele
atrapalharia o hot reload.

**Por que a API não é cacheada no SW:** o cache do SW é por URL e não conhece
tenant. Numa máquina compartilhada, servir `/api/job-cards` do cache entregaria
dados de outra oficina. Os dados offline vêm do React Query, que é limpo na
troca de usuário.

### 2. Cache de dados (React Query)

`PersistQueryClientProvider` grava as queries bem-sucedidas em
`localStorage['gestor.query-cache']`, com `maxAge` de 24h. Ao abrir offline, o
app hidrata com esses dados e as telas mostram a lista em vez de erro — o
`QueryError` só aparece quando não há **nenhum** dado em cache.

### 3. Sessão

`/api/me` é cacheado em `localStorage['gestor.session']`. Sem rede:

- o `AuthProvider` usa a última sessão conhecida;
- se o hook do Better Auth ficar pendurado, um fallback de 4s entra com o cache;
- apenas uma resposta **online** sem sessão limpa o cache (logout de verdade).

`login` e `logout` removem `gestor.session` e `gestor.query-cache`.

### 4. Indicador

Faixa no topo (app e back-office):

- offline: *"Sem conexão · mostrando dados salvos"*;
- online com pendências: *"Enviando N operações…"* + **Tentar agora**.

## Limitações (importantes)

- **A fila de mutações vive em memória.** Fechar ou recarregar o app com uma
  operação pendente a descarta. Para persistir, o caminho é
  `experimental_createPersister` do TanStack Query ou um outbox próprio em
  IndexedDB.
- **24h de cache.** Depois disso, offline o app abre, mas as listas podem vir
  vazias.
- **Sem background sync.** O envio só acontece com o app aberto e a rede de
  volta.
- **Dados não cifrados** no `localStorage`. Em aparelho compartilhado, sair da
  conta antes de entregar o celular.
- **Sem logo/visualização de PDF offline** (o PDF é gerado no servidor).

## Como testar

O service worker só existe no build de produção:

```bash
pnpm --filter @gestor/web build
pnpm --filter @gestor/web start
```

1. Abra `http://localhost:3000/m/hoje` e navegue por Hoje, Caixa e uma OS.
2. DevTools → **Application → Service Workers**: confirme `sw.js` ativo.
3. DevTools → **Network → Offline** e recarregue.
4. A faixa âmbar deve aparecer e as listas continuam com os últimos dados.
5. Volte online: a faixa muda para *Enviando…* se houver operação pausada.

Para atualizar o SW, suba `VERSION` em `public/sw.js`; o `activate` apaga os
caches antigos.

## Próximo passo

O offline "de verdade" — fila persistente, sync bidirecional e inspeção com
câmera — é o app **Expo + PowerSync**, previsto para depois da validação do PWA
com oficinas reais.
