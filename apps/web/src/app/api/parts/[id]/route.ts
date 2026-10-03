import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdatePartDto } from '@/server/dtos/update-part.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findPart,
  removePart,
  updatePart,
} from '@/server/services/parts.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['part.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findPart(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['part.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdatePartDto);
    return NextResponse.json(await updatePart(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['part.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removePart(assertUuid(id)));
  });
}
