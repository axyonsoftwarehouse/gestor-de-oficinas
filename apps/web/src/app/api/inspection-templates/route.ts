import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runRoute } from '@/server/auth/with-route';
import { CreateInspectionTemplateDto } from '@/server/dtos/create-inspection-template.dto';
import { QueryInspectionTemplateDto } from '@/server/dtos/query-inspection-template.dto';
import { parseBody, parseQuery } from '@/server/http/parse-body';
import {
  createInspectionTemplate,
  listInspectionTemplates,
} from '@/server/services/inspection-templates.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['inspection.view'] }, req, async (request) => {
    const query = await parseQuery(request, QueryInspectionTemplateDto);
    return NextResponse.json(await listInspectionTemplates(query));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return runRoute({ permissions: ['inspection.create'] }, req, async (request) => {
    const dto = await parseBody(request, CreateInspectionTemplateDto);
    return NextResponse.json(await createInspectionTemplate(dto), { status: 201 });
  });
}
