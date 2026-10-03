import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateExpenseDto } from '@/server/dtos/update-expense.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findExpense,
  removeExpense,
  updateExpense,
} from '@/server/services/expenses.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['expense.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findExpense(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['expense.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateExpenseDto);
    return NextResponse.json(await updateExpense(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['expense.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeExpense(assertUuid(id)));
  });
}
