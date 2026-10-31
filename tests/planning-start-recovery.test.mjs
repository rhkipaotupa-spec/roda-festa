import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { startPlanningSessionCommand } from '../api/planning-sessions.js';
import { startPlanningSession } from '../src/planner/planning-book/planningSessionClient.js';
import { createPlanningSessionRepository } from '../api/_lib/planning-session-repository.js';
import { createMemoryPlanningSessionAdapter } from '../api/_lib/planning-session-adapters/memory.js';
import { getPlanningSessionToken } from '../api/_lib/planning-session-security.js';

const input = { clientName: 'Teste local', phone: '11999999999', eventDate: '2099-11-11', eventType: 'infantil', adults: 50, olderChildren: 0, children: 0, duration: 4, selectedProductIds: ['mini-hot-dog'], includeWaiters: false, includeDisposables: false };

test('lost start response retries the same stored session using a cookie established before persistence', async () => {
  const repository = createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  let cookie = '', created = 0, attempts = 0;
  const actions = [];
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body); actions.push(body.action);
    assert.equal(options.credentials, 'same-origin');
    if (body.action === 'prepare') {
      const response = { setHeader(name, value) { if (name === 'Set-Cookie') cookie = value.split(';')[0]; }, status(n) { this.code = n; return this; }, json(data) { this.data = data; } };
      await handler({ method: 'POST', headers: { origin: 'http://localhost:4173', host: 'localhost:4173', cookie }, body }, response);
      assert.equal(response.code, 200);
      return new Response(JSON.stringify(response.data));
    }
    assert.ok(cookie, 'possession cookie must precede the write');
    assert.equal(body.requirePreparedSession, true);
    const result = await startPlanningSessionCommand({ body, token: getPlanningSessionToken({ headers: { cookie } }), repository });
    if (result.created) created++;
    if (++attempts === 1) throw new Error('response_lost_after_commit');
    return new Response(JSON.stringify({ ok: true, ...result }));
  };
  const options = { fetchImpl, clientRequestId: 'response-lost-1234567890' };
  await assert.rejects(startPlanningSession(input, options), /response_lost_after_commit/);
  const recovered = await startPlanningSession(input, options);
  assert.equal(recovered.created, false);
  assert.equal(created, 1);
  assert.deepEqual(actions, ['prepare', 'start', 'prepare', 'start']);
  await assert.rejects(startPlanningSessionCommand({ body: { ...input, clientRequestId: options.clientRequestId }, token: 'different-owner', repository }), /idempotency_conflict/);
});

test('new client with missing cookie fails before a database write or catalog read', async () => {
  const response = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await handler({ method: 'POST', headers: { origin: 'http://localhost:4173', host: 'localhost:4173' }, body: { action: 'start', requirePreparedSession: true } }, response);
  assert.equal(response.code, 409);
  assert.equal(response.data.error, 'planning_session_cookie_required');
});
