import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateQuotationDto } from '@/server/dtos/create-quotation.dto';
import { QueryQuotationDto } from '@/server/dtos/query-quotation.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import {
  createQuotation,
  listQuotations,
} from '@/server/services/quotations.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['quotation.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryQuotationDto);
    return NextResponse.json(await listQuotations(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute(
    { permissions: ['quotation.create'] },
    req,
    async (request, session) => {
      const dto = await parseBody(request, CreateQuotationDto);
      return NextResponse.json(await createQuotation(dto, session.authUserId), {
        status: 201,
      });
    },
  );
}
