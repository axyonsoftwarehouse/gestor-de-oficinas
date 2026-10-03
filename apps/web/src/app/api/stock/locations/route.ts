import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateLocationDto } from '@/server/dtos/create-location.dto';
import { parseBody } from '@/server/http/parse-body';
import { createLocation, listLocations } from '@/server/services/stock.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['stock.view'] }, req, async (request) => {
    const branchId = request.nextUrl.searchParams.get('branchId') ?? undefined;
    return NextResponse.json(await listLocations(branchId));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['stock.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateLocationDto);
    return NextResponse.json(await createLocation(dto), { status: 201 });
  });
}
