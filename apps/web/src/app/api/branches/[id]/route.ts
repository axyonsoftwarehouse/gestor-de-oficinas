import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateBranchDto } from '@/server/dtos/update-branch.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { removeBranch, updateBranch } from '@/server/services/branches.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['branch.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateBranchDto);
    return NextResponse.json(await updateBranch(assertUuid(id), dto));
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['branch.delete'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await removeBranch(assertUuid(id)));
  });
}
