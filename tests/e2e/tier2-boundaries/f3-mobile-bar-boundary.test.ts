import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 2: F3 - Sticky Mobile Bar Viewport & Format Boundaries (R2)', () => {
  const client = new E2ETestClient();

  test('B3.1: Mobile bar is marked with data-mobile attribute for client-side viewport adaptation', async () => {
    const res = await client.getRoute('/bn');
    assert.equal(res.status, 200);
    assert.match(res.body, /data-mobile="true"/);
  });

  test('B3.2: Telephone CTA handles international Bangladesh dialing code (+880)', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /href="tel:\+880\d+"/);
  });

  test('B3.3: WhatsApp CTA points to official wa.me domain with clean digits', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /href="https:\/\/wa\.me\/880\d+"/);
  });

  test('B3.4: Emergency disclaimer text remains prominently visible on English route', async () => {
    const res = await client.getRoute('/en');
    assert.match(res.body, /emergency-disclaimer-banner/);
    assert.match(res.body, /call 999/i);
  });

  test('B3.5: Mobile action bar book appointment link routes to current locale booking page', async () => {
    const resBn = await client.getRoute('/bn');
    assert.match(resBn.body, /href="\/bn\/appointment"/);

    const resEn = await client.getRoute('/en');
    assert.match(resEn.body, /href="\/en\/appointment"/);
  });
});
