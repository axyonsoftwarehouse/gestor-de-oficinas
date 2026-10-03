import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateSupplierDto } from '@/server/dtos/update-supplier.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findSupplier,
  removeSupplier,
  updateSupplier,
} from '@/server/services/suppliers.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['supplier.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findSupplier(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['supplier.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateSupplierDto);
    return NextResponse.json(await updateSupplier(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['supplier.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeSupplier(assertUuid(id)));
  });
}
