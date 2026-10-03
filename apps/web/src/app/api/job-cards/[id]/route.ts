import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateJobCardDto } from '@/server/dtos/update-job-card.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { findJobCard, updateJobCard } from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findJobCard(assertUuid(id)));
  });
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, UpdateJobCardDto);
    return NextResponse.json(await updateJobCard(assertUuid(id), dto));
  });
}
