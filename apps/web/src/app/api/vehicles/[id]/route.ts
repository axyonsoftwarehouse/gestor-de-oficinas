import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateVehicleDto } from '@/server/dtos/update-vehicle.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findVehicle,
  removeVehicle,
  updateVehicle,
} from '@/server/services/vehicles.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['vehicle.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findVehicle(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['vehicle.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateVehicleDto);
    return NextResponse.json(await updateVehicle(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['vehicle.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeVehicle(assertUuid(id)));
  });
}
