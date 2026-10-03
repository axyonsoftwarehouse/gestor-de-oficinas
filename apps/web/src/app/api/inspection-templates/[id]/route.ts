import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { assertUuid } from '@/server/http/params';
import { findInspectionTemplate } from '@/server/services/inspection-templates.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['inspection.view'] }, req, async () => {
    const { id } = await ctx.params;
    return NextResponse.json(await findInspectionTemplate(assertUuid(id)));
  });
}
