import { neon } from '@neondatabase/serverless';
import { HttpError, rateKey } from './security.js';

export function database() { return neon(process.env.DATABASE_URL); }
export async function rateLimit(sql, request, action, max, seconds) {
  const key = rateKey(request, action);
  const rows = await sql`
    INSERT INTO wedding_rate_limits (key, count, resets_at)
    VALUES (${key}, 1, now() + ${seconds} * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN wedding_rate_limits.resets_at <= now() THEN 1 ELSE wedding_rate_limits.count + 1 END,
      resets_at = CASE WHEN wedding_rate_limits.resets_at <= now() THEN excluded.resets_at ELSE wedding_rate_limits.resets_at END
    RETURNING count`;
  if (rows[0].count > max) throw new HttpError(429, 'Too many attempts. Please try again later.');
}
