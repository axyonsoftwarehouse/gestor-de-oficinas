import { BadRequestError } from './errors';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida um parâmetro de rota no formato UUID (equivalente ao ParseUUIDPipe). */
export function assertUuid(value: string, label = 'id'): string {
  if (!UUID_RE.test(value)) {
    throw new BadRequestError(`${label} inválido`);
  }
  return value;
}
