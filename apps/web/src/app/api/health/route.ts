import { system } from '@/server/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Health check público com ping no banco. */
export async function GET(): Promise<Response> {
  try {
    await system.$queryRaw`SELECT 1`;
  } catch {
    return Response.json(
      { status: 'error', db: 'down' },
      { status: 503 },
    );
  }

  return Response.json({
    status: 'ok',
    service: 'gestor-oficinas-web',
    db: 'up',
    timestamp: new Date().toISOString(),
  });
}
