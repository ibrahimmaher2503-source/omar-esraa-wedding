import { database, rateLimit } from '../lib/database.js';
import { readJson, validateResponse, json, handleError, HttpError } from '../lib/security.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
    try {
      const row = validateResponse(await readJson(request));
      const sql = database();
      await rateLimit(sql, request, 'responses', 20, 600);
      const saved = await sql`INSERT INTO wedding_responses (id, kind, name, attending, message)
        VALUES (${row.id}, ${row.kind}, ${row.name}, ${row.attending}, ${row.message})
        ON CONFLICT (id) DO UPDATE SET name=excluded.name, attending=excluded.attending, message=excluded.message
        WHERE wedding_responses.kind=excluded.kind RETURNING id`;
      if (!saved.length) throw new HttpError(409, 'This submission belongs to a different response type.');
      return json({ saved: true });
    } catch (error) { return handleError(error); }
  },
};
