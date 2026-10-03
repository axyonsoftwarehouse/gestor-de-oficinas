import type { NextRequest } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { renderInvoiceDocument } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['invoice.view'] }, req, async () => {
    const { id } = await ctx.params;
    const html = await renderInvoiceDocument(assertUuid(id));
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });
}
