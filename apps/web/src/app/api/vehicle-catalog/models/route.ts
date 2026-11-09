import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateVehicleModelDto } from '@/server/dtos/create-vehicle-model.dto';
import { QueryVehicleModelDto } from '@/server/dtos/query-vehicle-model.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createModel, listModels } from '@/server/services/vehicle-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryVehicleModelDto);
    return NextResponse.json(await listModels(query.brandId));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateVehicleModelDto);
    return NextResponse.json(await createModel(dto.brandId, dto.name), {
      status: 201,
    });
  });
}
