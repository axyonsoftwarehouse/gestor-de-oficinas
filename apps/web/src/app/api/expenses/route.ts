import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateExpenseDto } from '@/server/dtos/create-expense.dto';
import { QueryExpenseDto } from '@/server/dtos/query-expense.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createExpense, listExpenses } from '@/server/services/expenses.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['expense.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryExpenseDto);
    return NextResponse.json(await listExpenses(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['expense.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateExpenseDto);
    return NextResponse.json(await createExpense(dto), { status: 201 });
  });
}
