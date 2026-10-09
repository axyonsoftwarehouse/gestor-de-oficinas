import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { provisionTenant } from '@/server/auth/provision';
import { RegisterTenantDto } from '@/server/auth/dto/register-tenant.dto';
import { handleError } from '@/server/http/handle-error';
import { parseBody } from '@/server/http/parse-body';
import { clientIp, rateLimit, sweepRateLimitBuckets } from '@/server/http/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    sweepRateLimitBuckets();
    rateLimit(`register:${clientIp(req)}`, 5, 60_000);
    const dto = await parseBody(req, RegisterTenantDto);
    const result = await provisionTenant(dto);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
