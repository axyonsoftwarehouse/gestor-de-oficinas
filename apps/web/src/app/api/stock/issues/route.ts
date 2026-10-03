import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { IssueToJobDto } from '@/server/dtos/issue-to-job.dto';
import { parseBody } from '@/server/http/parse-body';
import { issueToJob } from '@/server/services/stock.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['stock.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, IssueToJobDto);
      return NextResponse.json(await issueToJob(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
