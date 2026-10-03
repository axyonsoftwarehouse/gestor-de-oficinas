import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateJobLineDto } from '@/server/dtos/create-job-line.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { addJobLine } from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.edit'] }, req, async (request) => {
    const { id } = await ctx.params;
    const dto = await parseBody(request, CreateJobLineDto);
    return NextResponse.json(await addJobLine(assertUuid(id), dto), {
      status: 201,
    });
  });
}
