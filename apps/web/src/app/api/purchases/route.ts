import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreatePurchaseDto } from '@/server/dtos/create-purchase.dto';
import { QueryPurchaseDto } from '@/server/dtos/query-purchase.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createPurchase, listPurchases } from '@/server/services/purchases.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['purchase.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryPurchaseDto);
    return NextResponse.json(await listPurchases(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['purchase.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, CreatePurchaseDto);
      return NextResponse.json(await createPurchase(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
