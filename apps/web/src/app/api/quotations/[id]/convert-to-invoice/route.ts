import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { convertQuotationToInvoice } from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['invoice.create'] },
    req,
    async (_request, session) => {
      const { id } = await ctx.params;
      return NextResponse.json(
        await convertQuotationToInvoice(assertUuid(id), session.authUserId),
        { status: 201 },
      );
    },
  );
}
