import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateUserDto } from '@/server/dtos/create-user.dto';
import { QueryUserDto } from '@/server/dtos/query-user.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import { createUser, listUsers } from '@/server/services/users.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['user.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryUserDto);
    return NextResponse.json(await listUsers(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['user.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateUserDto);
    return NextResponse.json(await createUser(dto), { status: 201 });
  });
}
