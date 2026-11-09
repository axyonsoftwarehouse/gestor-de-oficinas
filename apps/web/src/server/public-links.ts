import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Links públicos de orçamento.
 *
 * O token é assinado (HMAC-SHA256) e carrega `quotationId`, `tenantId` e a
 * expiração — nada de coluna nova no banco. A autorização real continua no
 * servidor: o link só dá acesso àquele orçamento, enquanto ele estiver em um
 * estado que aceite decisão do cliente.
 */

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export class InvalidPublicLinkError extends Error {
  constructor(message = 'Link inválido ou expirado') {
    super(message);
    this.name = 'InvalidPublicLinkError';
  }
}

export interface QuotationLinkPayload {
  /** Quotation id. */
  q: string;
  /** Tenant id. */
  t: string;
  /** Expiração em segundos (epoch). */
  e: number;
}

function getSecret(): string {
  const secret = process.env.PUBLIC_LINK_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Defina PUBLIC_LINK_SECRET (ou BETTER_AUTH_SECRET) para assinar links públicos.',
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createQuotationLink(
  quotationId: string,
  tenantId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): { token: string; expiresAt: Date } {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload: QuotationLinkPayload = { q: quotationId, t: tenantId, e: expiresAt };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return { token: `${encoded}.${sign(encoded)}`, expiresAt: new Date(expiresAt * 1000) };
}

export function parseQuotationLink(token: string): QuotationLinkPayload {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) throw new InvalidPublicLinkError();

  const expected = Buffer.from(sign(encoded));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new InvalidPublicLinkError();
  }

  let payload: QuotationLinkPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as QuotationLinkPayload;
  } catch {
    throw new InvalidPublicLinkError();
  }

  if (
    typeof payload?.q !== 'string' ||
    typeof payload?.t !== 'string' ||
    typeof payload?.e !== 'number'
  ) {
    throw new InvalidPublicLinkError();
  }
  if (payload.e * 1000 < Date.now()) {
    throw new InvalidPublicLinkError('Este orçamento expirou');
  }
  return payload;
}

export function publicQuotationPath(token: string): string {
  return `/o/${token}`;
}

/** URL absoluta para enviar ao cliente (usa BETTER_AUTH_URL quando definido). */
export function publicQuotationUrl(token: string, requestUrl?: string): string {
  const configured = process.env.BETTER_AUTH_URL?.replace(/\/$/, '');
  const base = configured ?? (requestUrl ? new URL(requestUrl).origin : '');
  return `${base}${publicQuotationPath(token)}`;
}
