import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateAppointmentDto } from '@/server/dtos/update-appointment.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  findAppointment,
  removeAppointment,
  updateAppointment,
} from '@/server/services/appointments.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['appointment.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findAppointment(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['appointment.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateAppointmentDto);
    return NextResponse.json(await updateAppointment(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['appointment.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeAppointment(assertUuid(id)));
  });
}
