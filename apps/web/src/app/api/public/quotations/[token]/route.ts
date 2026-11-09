import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { publicError } from '@/server/http/public-error';
import { getPublicQuotation } from '@/server/services/public-quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ token: string }>;
}

/** Dados do orçamento para o link público (sem sessão). */
export async function GET(_req: NextRequest, ctx: Ctx): Promise<Response> {
  try {
    const { token } = await ctx.params;
    return NextResponse.json(await getPublicQuotation(token));
  } catch (error) {
    return publicError(error);
  }
}
