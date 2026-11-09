import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { getDb } from '@/server/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Formas de pagamento ativas da oficina (usadas no recebimento rápido). */
export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['payment.view'] }, req, async () => {
    const methods = await getDb().paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    });
    return NextResponse.json(methods);
  });
}
