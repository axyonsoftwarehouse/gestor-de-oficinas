import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateQuotationDto } from '@/server/dtos/update-quotation.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findQuotation,
  removeQuotation,
  updateQuotation,
} from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findQuotation(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateQuotationDto);
    return NextResponse.json(await updateQuotation(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeQuotation(assertUuid(id)));
  });
}
