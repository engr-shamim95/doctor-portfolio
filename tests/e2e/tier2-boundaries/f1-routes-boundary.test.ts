import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 2: F1 - Public Routes Boundary & Corner Cases (R2)', () => {
  const client = new E2ETestClient();

  test('B1.1: Unsupported locale (/fr, /de, /es) returns 404 Not Found', async () => {
    const resFr = await client.getRoute('/fr');
    assert.equal(resFr.status, 404);
    assert.match(resFr.body, /Unsupported Locale/);

    const resDe = await client.getRoute('/de/appointment');
    assert.equal(resDe.status, 404);
  });

  test('B1.2: Empty or root route / issues 307 redirect to default /bn', async () => {
    const res = await client.getRoute('/');
    assert.equal(res.status, 307);
    assert.equal(res.headers['location'], '/bn');
  });

  test('B1.3: Non-existent route slug returns 404 Not Found', async () => {
    const res = await client.getRoute('/bn/services/non-existent-specialty-xyz');
    assert.equal(res.status, 404);
  });

  test('B1.4: Massive query strings (stress boundary) handled gracefully without server crash', async () => {
    const bigParam = 'a'.repeat(4096);
    const res = await client.getRoute(`/bn?ref=${bigParam}`);
    assert.equal(res.status, 200);
    assert.match(res.body, /<html\s+lang="bn"/);
  });

  test('B1.5: Localized appointment wizard route (/bn/appointment) returns 200 with booking form', async () => {
    const res = await client.getRoute('/bn/appointment');
    assert.equal(res.status, 200);
    assert.match(res.body, /booking-wizard/);
  });
});
