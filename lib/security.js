import { createHmac, timingSafeEqual, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const lifetime = 12 * 60 * 60;
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
export function handleError(error) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error('Wedding API request failed');
  return json({ error: 'Unable to complete this request. Please try again.' }, 503);
}
export async function readJson(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new HttpError(403, 'Invalid origin');
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new HttpError(415, 'Expected JSON');
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new HttpError(413, 'Request too large'); }
      chunks.push(value);
    }
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'Invalid JSON'); }
}
export function validateResponse(input) {
  const invalid = () => { throw new HttpError(400, 'Invalid response. Check your name and message.'); };
  if (!input || typeof input !== 'object') invalid();
  const { id, kind, attending } = input;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) invalid();
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) invalid();
  if (kind === 'rsvp' && typeof attending === 'boolean') return { id, kind, name, attending, message: null };
  if (kind === 'wish' && message && message.length <= 500 && !message.includes('\0')) return { id, kind, name, attending: null, message };
  invalid();
}
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Admin session is not configured');
  return value;
}
function sign(value) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
export function makeSession(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(now / 1000) + lifetime })).toString('base64url');
  return payload + '.' + sign(payload);
}
export function isAdmin(request) {
  try {
    const token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('__Host-wedding-admin='))?.slice(21);
    if (!token || token.length > 512) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const expected = Buffer.from(sign(parts[0]));
    const actual = Buffer.from(parts[1]);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return data.role === 'admin' && Number.isSafeInteger(data.exp) && data.exp > Date.now() / 1000;
  } catch { return false; }
}
export async function validPassword(password) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, hash] = (process.env.ADMIN_PASSWORD_HASH || '').split(':');
  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) throw new Error('Admin password is not configured');
  const actual = await deriveKey(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function sessionCookie(token) {
  return `__Host-wedding-admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token ? lifetime : 0}`;
}
export function rateKey(request, action) {
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
  return createHmac('sha256', secret()).update(action + ':' + ip.split(',')[0].trim()).digest('hex');
}
