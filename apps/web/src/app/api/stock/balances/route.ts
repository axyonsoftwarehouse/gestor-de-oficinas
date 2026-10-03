import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { QueryBalanceDto } from '@/server/dtos/query-balance.dto';
import { parseQuery } from '@/server/http/parse-body';
import { listBalances } from '@/server/services/stock.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['stock.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryBalanceDto);
    return NextResponse.json(await listBalances(query));
  });
}
