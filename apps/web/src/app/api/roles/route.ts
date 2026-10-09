import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateRoleDto } from '@/server/dtos/create-role.dto';
import { parseBody } from '@/server/http/parse-body';
import { createRole, listRoles } from '@/server/services/roles.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['role.view'] }, req, async () =>
    NextResponse.json(await listRoles()),
  );
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['role.create'] }, req, async (request, session) => {
    const dto = await parseBody(request, CreateRoleDto);
    return NextResponse.json(await createRole(dto, session.permissions), {
      status: 201,
    });
  });
}
