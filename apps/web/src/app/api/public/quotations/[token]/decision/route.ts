import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PublicDecisionDto } from '@/server/dtos/public-decision.dto';
import { parseBody } from '@/server/http/parse-body';
import { publicError } from '@/server/http/public-error';
import { decidePublicQuotation } from '@/server/services/public-quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ token: string }>;
}

/** Cliente aprova ou recusa o orçamento pelo link, sem login. */
export async function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  try {
    const { token } = await ctx.params;
    const dto = await parseBody(req, PublicDecisionDto);
    return NextResponse.json(await decidePublicQuotation(token, dto.decision));
  } catch (error) {
    return publicError(error);
  }
}
