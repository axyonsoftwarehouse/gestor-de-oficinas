import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateVehicleBrandDto } from '@/server/dtos/create-vehicle-brand.dto';
import { parseBody } from '@/server/http/parse-body';
import { createBrand, listBrands } from '@/server/services/vehicle-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.view'] }, req, async () =>
    NextResponse.json(await listBrands()),
  );
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['vehicle.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateVehicleBrandDto);
    return NextResponse.json(await createBrand(dto.name), { status: 201 });
  });
}
