import { database, rateLimit } from '../lib/database.js';
import { readJson, json, handleError, HttpError, validPassword, makeSession, isAdmin, sessionCookie } from '../lib/security.js';

export default {
  async fetch(request) {
    try {
      if (request.method === 'POST') {
        const body = await readJson(request);
        if (body?.action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('') });
        if (body?.action !== 'login') throw new HttpError(400, 'Invalid action');
        await rateLimit(database(), request, 'login', 5, 900);
        const passwordOK = await validPassword(body.password);
        if (body.username !== 'admin' || !passwordOK) throw new HttpError(401, 'Invalid username or password');
        return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(makeSession()) });
      }
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
      if (!isAdmin(request)) throw new HttpError(401, 'Please sign in');
      const url = new URL(request.url);
      const kind = url.searchParams.get('kind') || 'rsvp';
      const page = Number(url.searchParams.get('page') || 1);
      if (!['rsvp', 'wish'].includes(kind) || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new HttpError(400, 'Invalid page');
      const sql = database();
      const [counts, rows] = await sql.transaction([
        sql`SELECT count(*) FILTER (WHERE kind='rsvp' AND attending)::int AS attending,
          count(*) FILTER (WHERE kind='rsvp' AND NOT attending)::int AS declined,
          count(*) FILTER (WHERE kind='wish')::int AS wishes FROM wedding_responses`,
        sql`SELECT id, name, attending, message, created_at FROM wedding_responses
          WHERE kind=${kind} ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET ${(page - 1) * 50}`,
      ]);
      return json({ counts: counts[0], rows, page });
    } catch (error) { return handleError(error); }
  },
};
