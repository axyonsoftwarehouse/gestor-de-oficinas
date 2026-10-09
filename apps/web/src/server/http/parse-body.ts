import 'server-only';
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { isPartialDto } from '../dtos/partial-type';
import { BadRequestError } from './errors';

type Class<T> = new () => T;

function flatten(errors: ValidationError[], parent = ''): string[] {
  const out: string[] = [];
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      out.push(...Object.values(error.constraints).map((m) => `${path}: ${m}`));
    }
    if (error.children && error.children.length > 0) {
      out.push(...flatten(error.children, path));
    }
  }
  return out;
}

async function validateDto<T extends object>(
  raw: Record<string, unknown>,
  dto: Class<T>,
): Promise<T> {
  const instance = plainToInstance(dto, raw, { enableImplicitConversion: true });
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: isPartialDto(dto),
  });
  if (errors.length > 0) {
    throw new BadRequestError(flatten(errors).join('; '));
  }
  return instance;
}

/** Valida o corpo JSON de uma requisição contra um DTO (class-validator). */
export async function parseBody<T extends object>(
  req: Request,
  dto: Class<T>,
): Promise<T> {
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return validateDto(raw, dto);
}

/** Valida a query string contra um DTO. */
export function parseQuery<T extends object>(
  req: Request,
  dto: Class<T>,
): Promise<T> {
  const url = new URL(req.url);
  const raw: Record<string, unknown> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return validateDto(raw, dto);
}
