import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { removeInvoicePayment } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string; paymentId: string }>;
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['payment.delete'] }, req, async () => {
    const { id, paymentId } = await ctx.params;
    return NextResponse.json(
      await removeInvoicePayment(assertUuid(id), assertUuid(paymentId, 'paymentId')),
    );
  });
}
