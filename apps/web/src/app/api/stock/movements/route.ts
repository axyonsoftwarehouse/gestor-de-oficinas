import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateMovementDto } from '@/server/dtos/create-movement.dto';
import { QueryMovementDto } from '@/server/dtos/query-movement.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createMovement, listMovements } from '@/server/services/stock.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['stock.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryMovementDto);
    return NextResponse.json(await listMovements(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['stock.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, CreateMovementDto);
      return NextResponse.json(await createMovement(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
