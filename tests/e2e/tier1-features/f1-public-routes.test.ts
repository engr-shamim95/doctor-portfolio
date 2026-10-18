import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 1: F1 - Public Localized Routes Coverage (R2)', () => {
  const client = new E2ETestClient();

  test('F1.1: Root path redirects to primary default locale /bn', async () => {
    const res = await client.getRoute('/');
    assert.equal(res.status, 307);
    assert.equal(res.headers['location'], '/bn');
  });

  test('F1.2: Bengali homepage (/bn) renders 200 OK with lang="bn" and localized content', async () => {
    const res = await client.getRoute('/bn');
    assert.equal(res.status, 200);
    assert.match(res.body, /<html\s+lang="bn"/);
    assert.match(res.body, /ডাঃ আরিফুল ইসলাম/);
  });

  test('F1.3: English homepage (/en) renders 200 OK with lang="en" and English content', async () => {
    const res = await client.getRoute('/en');
    assert.equal(res.status, 200);
    assert.match(res.body, /<html\s+lang="en"/);
    assert.match(res.body, /Dr\. Ariful Islam/);
  });

  test('F1.4: Localized services page (/bn/services) returns 200 with service directory catalog', async () => {
    const res = await client.getRoute('/bn/services');
    assert.equal(res.status, 200);
    assert.match(res.body, /Services Directory/);
    assert.match(res.body, /General Medicine/);
  });

  test('F1.5: Localized chambers page (/bn/chambers) returns 200 with chamber locations', async () => {
    const res = await client.getRoute('/bn/chambers');
    assert.equal(res.status, 200);
    assert.match(res.body, /Chambers/);
    assert.match(res.body, /Dhanmondi Chamber/);
  });

  test('F1.6: Localized health blog page (/bn/blog) returns 200 with reading time indicator', async () => {
    const res = await client.getRoute('/bn/blog');
    assert.equal(res.status, 200);
    assert.match(res.body, /Health Blog/);
    assert.match(res.body, /reading-time/);
  });
});
