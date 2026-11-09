import type { NextRequest } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { renderInvoicePdf } from '@/server/services/invoice-pdf.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface Ctx {
  params: Promise<{ id: string }>;
}

/** PDF da fatura, gerado no servidor sem navegador. */
export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['invoice.view'] }, req, async () => {
    const { id } = await ctx.params;
    const pdf = await renderInvoicePdf(assertUuid(id));
    const blob = new Blob([new Uint8Array(pdf)], { type: 'application/pdf' });

    return new Response(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="fatura-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  });
}
