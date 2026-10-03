import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateLineItemDto } from '@/server/dtos/line-item.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  removeQuotationLine,
  updateQuotationLine,
} from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string; lineId: string }>;
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.edit'] }, req, async (request) => {
    const { id, lineId } = await ctx.params;
    const dto = await parseBody(request, UpdateLineItemDto);
    return NextResponse.json(
      await updateQuotationLine(assertUuid(id), assertUuid(lineId, 'lineId'), dto),
    );
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.edit'] }, req, async () => {
    const { id, lineId } = await ctx.params;
    return NextResponse.json(
      await removeQuotationLine(assertUuid(id), assertUuid(lineId, 'lineId')),
    );
  });
}
