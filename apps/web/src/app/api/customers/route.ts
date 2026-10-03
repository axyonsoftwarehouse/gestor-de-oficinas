import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateCustomerDto } from '@/server/dtos/create-customer.dto';
import { QueryCustomerDto } from '@/server/dtos/query-customer.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createCustomer, listCustomers } from '@/server/services/customers.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['customer.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryCustomerDto);
    return NextResponse.json(await listCustomers(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['customer.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateCustomerDto);
    return NextResponse.json(await createCustomer(dto), { status: 201 });
  });
}
