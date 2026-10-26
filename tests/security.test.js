import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';

test('responses reject invalid input and keep legitimate text as data', async () => {
  const { validateResponse } = await import('../lib/security.js');
  const row = { id: crypto.randomUUID(), kind: 'rsvp', name: "  O'Neil <script>  ", attending: false };
  assert.equal(validateResponse(row).name, "O'Neil <script>");
  for (const bad of [{ ...row, attending: 'false' }, { ...row, id: '1' }, { ...row, name: ' ' }, { ...row, kind: 'wish', message: 'a'.repeat(501) }, { ...row, name: 'a'.repeat(81) }, null]) {
    assert.throws(() => validateResponse(bad), /Invalid/);
  }
});

test('admin sessions fail closed on forgery, expiry, and wrong password', async () => {
  process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
  const salt = randomBytes(16).toString('hex');
  process.env.ADMIN_PASSWORD_HASH = salt + ':' + scryptSync('test-password', salt, 64).toString('hex');
  const { makeSession, isAdmin, validPassword, sessionCookie } = await import('../lib/security.js');
  assert.equal(await validPassword('test-password'), true);
  assert.equal(await validPassword('wrong'), false);
  const token = makeSession();
  const req = value => new Request('https://wedding.example/api/admin', { headers: { cookie: '__Host-wedding-admin=' + value } });
  assert.equal(isAdmin(req(token)), true);
  assert.equal(isAdmin(req(token + 'x')), false);
  assert.equal(isAdmin(req(makeSession(Date.now() - 13 * 3600000))), false);
  assert.equal(isAdmin(req('bad')), false);
  assert.match(sessionCookie(token), /HttpOnly; Secure; SameSite=Strict/);
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(isAdmin(req(token)), false);
});

test('JSON boundary rejects cross-origin and oversized bodies', async () => {
  const { readJson } = await import('../lib/security.js');
  const req = (origin, body) => new Request('https://wedding.example/api/responses', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body });
  assert.deepEqual(await readJson(req('https://wedding.example', '{"ok":true}')), { ok: true });
  await assert.rejects(readJson(req('https://evil.example', '{}')), /origin/i);
  await assert.rejects(readJson(req('https://wedding.example', 'x'.repeat(9000))), /large/i);
  await assert.rejects(readJson(req('https://wedding.example', '{broken')), /JSON/);
});
