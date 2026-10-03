import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateAppointmentStatusDto } from '@/server/dtos/update-appointment-status.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { updateAppointmentStatus } from '@/server/services/appointments.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['appointment.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateAppointmentStatusDto);
    return NextResponse.json(await updateAppointmentStatus(assertUuid(id), dto));
  });
}
