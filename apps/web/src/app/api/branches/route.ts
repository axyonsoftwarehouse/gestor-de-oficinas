import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateBranchDto } from '@/server/dtos/create-branch.dto';
import { parseBody } from '@/server/http/parse-body';
import { createBranch, listBranches } from '@/server/services/branches.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['branch.view'] }, req, async () =>
    NextResponse.json(await listBranches()),
  );
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['branch.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateBranchDto);
    return NextResponse.json(await createBranch(dto), { status: 201 });
  });
}
