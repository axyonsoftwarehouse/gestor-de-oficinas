# PDF das faturas

> Decisão de 2026-11: o PDF é gerado **no próprio servidor Next.js**, com
> `pdfkit`, sem navegador.

## Por que não Playwright

A decisão original do projeto era um serviço headless com Playwright. Na prática,
na Vercel isso significa embarcar um Chromium (`@sparticuz/chromium`) numa função
serverless: bundle grande, cold start maior, e nenhuma forma de testar localmente
sem um Chrome instalado na máquina.

Como o documento não precisa de fidelidade pixel-perfect (é uma fatura, não um
site), `pdfkit` resolve com:

- bundle pequeno e cold start desprezível;
- geração determinística em ~50 ms;
- teste no CI sem dependências externas;
- funcionamento igual em Windows, Linux e Vercel.

O HTML (`GET /api/invoices/:id/document`) continua existindo para visualização e
impressão pelo navegador. Se um dia for preciso HTML→PDF fiel, o caminho é
adicionar um renderizador Playwright **ao lado** deste, atrás de uma flag.

## Rotas

| Rota | Autenticação | O que faz |
| --- | --- | --- |
| `GET /api/invoices/[id]/pdf` | `invoice.view` | PDF da fatura (`application/pdf`, `inline`) |
| `GET /api/invoices/[id]/document` | `invoice.view` | HTML da fatura (inalterado) |

O PDF inclui: nome da oficina, número, emissão, status, cliente (com documento),
veículo/OS, itens com quantidade e valores, subtotal/descontos/impostos/total,
pago, saldo, pagamentos (data, forma, referência, valor) e rodapé paginado.

## Onde está

- `src/server/services/invoice-pdf.service.ts` — layout e paginação.
- `src/app/api/invoices/[id]/pdf/route.ts` — rota autenticada.
- Botão **PDF** na tela da fatura (back-office) e link **Abrir fatura em PDF**
  no recebimento do app.

## Teste

`apps/web/test/invoice-pdf.spec.ts` cobre:

- geração de um PDF íntegro (`%PDF-`, páginas, `%%EOF`) a partir de uma fatura
  criada no fluxo real (OS → orçamento → fatura);
- recusa de fatura de outra oficina (RLS).

O conteúdo textual é conferido visualmente — o pdfkit escreve texto em operadores
de fonte, não como string contínua no arquivo.

## Limitações conhecidas

- Sem logo da oficina (o modelo `Tenant` ainda não tem imagem).
- Fonte padrão Helvetica; acentos do português são cobertos pelo WinAnsi.
- Uma fatura muito longa gera várias páginas, mas o cabeçalho da oficina só
  aparece na primeira (a tabela repete o cabeçalho de colunas).
