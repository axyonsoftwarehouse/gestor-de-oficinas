import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { BadRequestError } from '@/server/http/errors';
import { assertUuid } from '@/server/http/params';
import { createQuotationLink, publicQuotationUrl } from '@/server/public-links';
import { findQuotation, sendQuotation } from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * Gera (ou renova) o link público do orçamento.
 * Coloca o orçamento em SENT quando ainda é rascunho.
 */
export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return runRoute({ permissions: ['quotation.edit'] }, req, async (request, session) => {
    const { id } = await ctx.params;
    const quotationId = assertUuid(id);

    const quotation = await findQuotation(quotationId);
    if (!['DRAFT', 'SENT'].includes(quotation.status)) {
      throw new BadRequestError(
        'Gere o link apenas para orçamentos em aberto (rascunho ou enviado).',
      );
    }
    if (quotation.status === 'DRAFT') {
      await sendQuotation(quotationId);
    }

    const { token, expiresAt } = createQuotationLink(quotationId, session.tenantId);
    return NextResponse.json({
      publicUrl: publicQuotationUrl(token, request.url),
      expiresAt: expiresAt.toISOString(),
    });
  });
}
