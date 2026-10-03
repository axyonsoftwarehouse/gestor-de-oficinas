import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { QueryInspectionDto } from '@/server/dtos/query-inspection.dto';
import { StartInspectionDto } from '@/server/dtos/start-inspection.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import {
  listInspections,
  startInspection,
} from '@/server/services/inspections.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['inspection.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryInspectionDto);
    return NextResponse.json(await listInspections(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['inspection.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, StartInspectionDto);
      return NextResponse.json(await startInspection(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
