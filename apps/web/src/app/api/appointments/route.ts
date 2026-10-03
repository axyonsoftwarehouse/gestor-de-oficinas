import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateAppointmentDto } from '@/server/dtos/create-appointment.dto';
import { QueryAppointmentDto } from '@/server/dtos/query-appointment.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import {
  createAppointment,
  listAppointments,
} from '@/server/services/appointments.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['appointment.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryAppointmentDto);
    return NextResponse.json(await listAppointments(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['appointment.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateAppointmentDto);
    return NextResponse.json(await createAppointment(dto), { status: 201 });
  });
}
