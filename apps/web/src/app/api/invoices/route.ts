import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { QueryInvoiceDto } from '@/server/dtos/query-invoice.dto';
import { parseQuery } from '@/server/http/parse-body';
import { listInvoices } from '@/server/services/invoices.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['invoice.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryInvoiceDto);
    return NextResponse.json(await listInvoices(query));
  });
}
