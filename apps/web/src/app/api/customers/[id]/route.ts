import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateCustomerDto } from '@/server/dtos/update-customer.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findCustomer,
  removeCustomer,
  updateCustomer,
} from '@/server/services/customers.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['customer.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findCustomer(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['customer.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateCustomerDto);
    return NextResponse.json(await updateCustomer(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['customer.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeCustomer(assertUuid(id)));
  });
}
