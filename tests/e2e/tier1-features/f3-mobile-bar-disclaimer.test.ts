import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 1: F3 - Sticky Mobile Action Bar & Emergency Disclaimer Coverage (R2)', () => {
  const client = new E2ETestClient();

  test('F3.1: Persistent sticky mobile action bar component is present in HTML', async () => {
    const res = await client.getRoute('/bn');
    assert.equal(res.status, 200);
    assert.match(res.body, /class="sticky-mobile-action-bar"/);
    assert.match(res.body, /data-mobile="true"/);
  });

  test('F3.2: Mobile bar contains telephone dialer link with tel: protocol', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /href="tel:\+?[0-9]+"/);
    assert.match(res.body, /class="btn-call"/);
  });

  test('F3.3: Mobile bar contains direct WhatsApp chat CTA with wa.me link', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /href="https:\/\/wa\.me\/[0-9]+"/);
    assert.match(res.body, /class="btn-whatsapp"/);
  });

  test('F3.4: Mobile bar contains direct appointment booking trigger', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /class="btn-book"/);
    assert.match(res.body, /href="\/bn\/appointment"/);
  });

  test('F3.5: Emergency medical care disclaimer banner is explicitly displayed with 999 helpline', async () => {
    const resBn = await client.getRoute('/bn');
    assert.match(resBn.body, /emergency-disclaimer/);
    assert.match(resBn.body, /৯৯৯|999/);

    const resContact = await client.getRoute('/bn/contact');
    assert.equal(resContact.status, 200);
    assert.match(resContact.body, /emergency-disclaimer/);
  });
});
