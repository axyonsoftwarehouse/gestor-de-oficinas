import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateRoleDto } from '@/server/dtos/update-role.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { findRole, removeRole, updateRole } from '@/server/services/roles.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['role.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findRole(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['role.edit'] }, req, async (request, session) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateRoleDto);
    return NextResponse.json(
      await updateRole(assertUuid(id), dto, session.permissions),
    );
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['role.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeRole(assertUuid(id)));
  });
}
