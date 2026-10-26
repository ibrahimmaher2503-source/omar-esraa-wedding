import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import responses from '../api/responses.js';
import admin from '../api/admin.js';
import { database } from '../lib/database.js';
import { rateKey } from '../lib/security.js';

test('real database saves private responses, deduplicates retries, and protects admin', { skip: !process.env.ADMIN_TEST_PASSWORD || !process.env.DATABASE_URL }, async () => {
  const origin = process.env.TEST_ORIGIN || 'https://wedding.example';
  const address = randomUUID();
  const req = (path, body, cookie = '', requestOrigin = origin) => new Request(origin + path, {
    method: body ? 'POST' : 'GET', headers: { origin: requestOrigin, 'content-type': 'application/json', cookie, 'x-forwarded-for': address }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const call = async (path, body, cookie, requestOrigin) => process.env.TEST_ORIGIN ? fetch(req(path, body, cookie, requestOrigin)) : (path.startsWith('/api/admin') ? admin : responses).fetch(req(path, body, cookie, requestOrigin));
  const sql = database();
  const id = randomUUID(), wishId = randomUUID();
  const row = { id, kind: 'rsvp', name: "QA O'Neil <script>", attending: false };
  try {
    assert.equal((await call('/api/admin')).status, 401);
    assert.equal((await call('/api/responses')).status, 405);
    assert.equal((await call('/api/responses', row, '', 'https://evil.example')).status, 403);
    assert.equal((await call('/api/responses', { ...row, attending: 'yes' })).status, 400);
    assert.equal((await call('/api/responses', row)).status, 200);
    assert.equal((await call('/api/responses', row)).status, 200);
    assert.equal((await sql`SELECT count(*)::int AS n FROM wedding_responses WHERE id=${id}`)[0].n, 1);
    assert.equal((await call('/api/responses', { ...row, attending: true })).status, 200);
    assert.equal((await sql`SELECT attending FROM wedding_responses WHERE id=${id}`)[0].attending, true);
    assert.equal((await call('/api/responses', { id: wishId, kind: 'wish', name: 'QA wishes', message: 'QA private message' })).status, 200);
    assert.equal((await call('/api/admin', { action: 'login', username: 'admin', password: 'wrong' })).status, 401);
    const login = await call('/api/admin', { action: 'login', username: 'admin', password: process.env.ADMIN_TEST_PASSWORD });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
    const listed = await call('/api/admin?kind=rsvp', undefined, cookie);
    assert.equal(listed.status, 200);
    assert.equal(listed.headers.get('cache-control'), 'no-store');
    assert.equal((await listed.json()).rows.find(r => r.id === id)?.name, row.name);
    const wishes = await (await call('/api/admin?kind=wish', undefined, cookie)).json();
    assert.equal(wishes.rows.find(r => r.id === wishId)?.message, 'QA private message');
    assert.equal((await call('/api/admin', undefined, cookie + 'forged')).status, 401);
    assert.match((await call('/api/admin', { action: 'logout' }, cookie)).headers.get('set-cookie'), /Max-Age=0/);
    if (!process.env.TEST_ORIGIN) {
      for (let i = 0; i < 3; i++) await call('/api/admin', { action: 'login', username: 'admin', password: 'wrong' });
      assert.equal((await call('/api/admin', { action: 'login', username: 'admin', password: 'wrong' })).status, 429);
    }
  } finally {
    await sql`DELETE FROM wedding_responses WHERE id=${id} OR id=${wishId}`;
    if (!process.env.TEST_ORIGIN) {
      const request = req('/api/admin');
      await sql`DELETE FROM wedding_rate_limits WHERE key=${rateKey(request, 'login')} OR key=${rateKey(request, 'responses')}`;
    }
  }
});
