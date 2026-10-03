import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { UpsertAnswerDto } from '@/server/dtos/upsert-answer.dto';
import { parseBody } from '@/server/http/parse-body';
import { assertUuid } from '@/server/http/params';
import { upsertInspectionAnswer } from '@/server/services/inspections.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string; questionId: string }>;
}

export function PUT(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute(
    { permissions: ['inspection.edit'] },
    req,
    async (request, session) => {
      const { id, questionId } = await ctx.params;
      const dto = await parseBody(request, UpsertAnswerDto);
      return NextResponse.json(
        await upsertInspectionAnswer(
          assertUuid(id),
          assertUuid(questionId, 'questionId'),
          dto,
          session.authUserId,
        ),
      );
    },
  );
}
