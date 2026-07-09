// Best-effort in-memory sliding-window limiter for public API routes. Not
// durable across Vercel serverless instances/cold starts — acceptable for
// free-tier public endpoints; a real distributed limiter (Upstash Redis)
// would cost money we're not spending yet. Logs nothing personal (IP is
// used in-memory only, never persisted).
//
// Each call site gets its own bucket (keyed by `bucket` + ip) so limits
// don't bleed across unrelated endpoints.

const buckets = new Map<string, Map<string, number[]>>();

export function isRateLimited(
  bucket: string,
  ip: string,
  opts: { windowMs?: number; maxRequests?: number } = {}
): boolean {
  const windowMs = opts.windowMs ?? 60_000;
  const maxRequests = opts.maxRequests ?? 40;

  let hits = buckets.get(bucket);
  if (!hits) {
    hits = new Map<string, number[]>();
    buckets.set(bucket, hits);
  }

  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(ip, timestamps);
  // Prevent unbounded growth if this instance stays warm a long time.
  if (hits.size > 5000) hits.clear();
  return timestamps.length > maxRequests;
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
