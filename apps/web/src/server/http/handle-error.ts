import { Prisma } from '@gestor/database';
import { NextResponse } from 'next/server';
import { HttpError } from './errors';

/** Converte exceções em respostas JSON (equivalente ao AllExceptionsFilter). */
export function handleError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Registro já existe' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Recurso não encontrado' },
        { status: 404 },
      );
    }
  }

  console.error('[api]', error);
  return NextResponse.json(
    { message: 'Erro interno do servidor' },
    { status: 500 },
  );
}
