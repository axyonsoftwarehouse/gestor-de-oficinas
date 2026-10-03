import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateSupplierDto } from '@/server/dtos/create-supplier.dto';
import { QuerySupplierDto } from '@/server/dtos/query-supplier.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import {
  createSupplier,
  listSuppliers,
} from '@/server/services/suppliers.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['supplier.view'] }, req, async (request) => {
    const query = await parseQuery(request, QuerySupplierDto);
    return NextResponse.json(await listSuppliers(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['supplier.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateSupplierDto);
    return NextResponse.json(await createSupplier(dto), { status: 201 });
  });
}
