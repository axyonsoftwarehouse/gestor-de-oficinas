import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateJobCardDto } from '@/server/dtos/create-job-card.dto';
import { QueryJobCardDto } from '@/server/dtos/query-job-card.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createJobCard, listJobCards } from '@/server/services/job-cards.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['job_card.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryJobCardDto);
    return NextResponse.json(await listJobCards(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['job_card.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, CreateJobCardDto);
      return NextResponse.json(await createJobCard(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
