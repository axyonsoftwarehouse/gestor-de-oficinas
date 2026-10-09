import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateUserDto } from '@/server/dtos/update-user.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { findUser, removeUser, updateUser } from '@/server/services/users.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['user.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findUser(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['user.edit'] }, req, async (request, session) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateUserDto);
    return NextResponse.json(
      await updateUser(assertUuid(id), dto, session.permissions),
    );
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['user.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeUser(assertUuid(id)));
  });
}
