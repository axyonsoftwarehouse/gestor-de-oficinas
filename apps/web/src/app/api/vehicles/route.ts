import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateVehicleDto } from '@/server/dtos/create-vehicle.dto';
import { QueryVehicleDto } from '@/server/dtos/query-vehicle.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createVehicle, listVehicles } from '@/server/services/vehicles.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryVehicleDto);
    return NextResponse.json(await listVehicles(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateVehicleDto);
    return NextResponse.json(await createVehicle(dto), { status: 201 });
  });
}
