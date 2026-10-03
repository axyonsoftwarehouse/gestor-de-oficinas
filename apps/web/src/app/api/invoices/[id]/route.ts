import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateInvoiceDto } from '@/server/dtos/update-invoice.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { findInvoice, updateInvoice } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['invoice.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findInvoice(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['invoice.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateInvoiceDto);
    return NextResponse.json(await updateInvoice(assertUuid(id), dto));
  });
}
