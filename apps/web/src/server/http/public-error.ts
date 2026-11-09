import { NextResponse } from 'next/server';
import { handleError } from '@/server/http/handle-error';
import { InvalidPublicLinkError } from '@/server/public-links';
import { BadRequestError } from '@/server/http/errors';

/** Resposta de erro das rotas públicas: 404 para link inválido, 400 para regra. */
export function publicError(error: unknown): Response {
  if (error instanceof InvalidPublicLinkError) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof BadRequestError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  return handleError(error);
}
