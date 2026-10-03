import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { TransitionJobCardDto } from '@/server/dtos/transition-job-card.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { transitionJobCard } from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['job_card.edit'] },
    req,
    async (request, session) => {
      const { id } = await ctx.params;
      const dto = await parseBody(request, TransitionJobCardDto);
      return NextResponse.json(
        await transitionJobCard(assertUuid(id), dto, session.authUserId),
      );
    },
  );
}
