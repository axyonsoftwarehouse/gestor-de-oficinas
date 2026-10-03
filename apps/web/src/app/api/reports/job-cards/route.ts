import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { jobCardsReport } from '@/server/services/reports.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['report.view'] }, req, async () =>
    NextResponse.json(await jobCardsReport()),
  );
}
