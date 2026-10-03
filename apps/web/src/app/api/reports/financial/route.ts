import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { QueryReportDto } from '@/server/dtos/query-report.dto';
import { parseQuery } from '@/server/http/parse-body';
import { financialReport } from '@/server/services/reports.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['report.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryReportDto);
    return NextResponse.json(await financialReport(query));
  });
}
