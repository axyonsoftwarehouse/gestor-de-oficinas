import { TooManyRequestsError } from './errors';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Rate limit em memória (por instância de função serverless).
 * Suficiente para conter abuso trivial; não é distribuído.
 * Se `MAX`/`window` forem atingidos, lança 429.
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new TooManyRequestsError();
  }
}

/** Limpa buckets expirados (evita crescimento indefinido do Map). */
export function sweepRateLimitBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Extrai o IP do cliente a partir dos cabeçalhos de proxy. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
