import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { removeMechanic } from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string; userId: string }>;
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['job_card.edit'] }, req, async () => {
    const { id, userId } = await ctx.params;
    return NextResponse.json(
      await removeMechanic(assertUuid(id), assertUuid(userId, 'userId')),
    );
  });
}
