import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreatePaymentDto } from '@/server/dtos/create-payment.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { addInvoicePayment } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['payment.create'] },
    req,
    async (request, session) => {
      const { id } = await ctx.params;
      const dto = await parseBody(request, CreatePaymentDto);
      return NextResponse.json(
        await addInvoicePayment(assertUuid(id), dto, session.authUserId),
        { status: 201 },
      );
    },
  );
}
