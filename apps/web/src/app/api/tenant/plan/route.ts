import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { system } from '@/server/db/prisma';
import { UpdatePlanDto } from '@/server/dtos/update-plan.dto';
import { parseBody } from '@/server/http/parse-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Alterna o recorte de features da oficina (essencial ↔ completo).
 * Não altera permissões: só o que a interface expõe.
 */
export function PATCH(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['setting.edit'] }, req, async (request, session) => {
    const dto = await parseBody(request, UpdatePlanDto);
    const tenant = await system.tenant.update({
      where: { id: session.tenantId },
      data: { plan: dto.plan },
      select: { id: true, name: true, plan: true },
    });
    return NextResponse.json(tenant);
  });
}
