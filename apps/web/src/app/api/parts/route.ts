import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreatePartDto } from '@/server/dtos/create-part.dto';
import { QueryPartDto } from '@/server/dtos/query-part.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createPart, listParts } from '@/server/services/parts.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['part.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryPartDto);
    return NextResponse.json(await listParts(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['part.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreatePartDto);
    return NextResponse.json(await createPart(dto), { status: 201 });
  });
}
