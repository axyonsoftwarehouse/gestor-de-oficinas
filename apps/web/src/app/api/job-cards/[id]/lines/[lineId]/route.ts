import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpdateJobLineDto } from '@/server/dtos/update-job-line.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import {
  removeJobLine,
  updateJobLine,
} from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string; lineId: string }>;
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.edit'] }, req, async (request) => {
    const { id, lineId } = await ctx.params;
    const dto = await parseBody(request, UpdateJobLineDto);
    return NextResponse.json(
      await updateJobLine(assertUuid(id), assertUuid(lineId, 'lineId'), dto),
    );
  });
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.edit'] }, req, async () => {
    const { id, lineId } = await ctx.params;
    return NextResponse.json(
      await removeJobLine(assertUuid(id), assertUuid(lineId, 'lineId')),
    );
  });
}
