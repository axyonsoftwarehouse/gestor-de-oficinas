import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { approveQuotation } from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['quotation.approve'] },
    req,
    async (_request, session) => {
      const { id } = await ctx.params;
      return NextResponse.json(
        await approveQuotation(assertUuid(id), session.authUserId),
      );
    },
  );
}
