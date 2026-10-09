import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateServiceDto } from '@/server/dtos/create-service.dto';
import { QueryServiceDto } from '@/server/dtos/query-service.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createService, listServices } from '@/server/services/services.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['service.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryServiceDto);
    return NextResponse.json(await listServices(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['service.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateServiceDto);
    return NextResponse.json(await createService(dto), { status: 201 });
  });
}
