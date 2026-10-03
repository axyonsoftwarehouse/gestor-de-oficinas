import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateLineItemDto } from '@/server/dtos/line-item.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { addQuotationLine } from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, CreateLineItemDto);
    return NextResponse.json(await addQuotationLine(assertUuid(id), dto), {
      status: 201,
    });
  });
}
