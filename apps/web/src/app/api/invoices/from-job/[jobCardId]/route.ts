import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { createInvoiceFromJobCard } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ jobCardId: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['invoice.create'] },
    req,
    async (_request, session) => {
      const { jobCardId } = await ctx.params;
      return NextResponse.json(
        await createInvoiceFromJobCard(
          assertUuid(jobCardId, 'jobCardId'),
          session.authUserId,
        ),
        { status: 201 },
      );
    },
  );
}
