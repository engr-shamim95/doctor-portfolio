import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 1: F2 - Doctor Credentials & Bio Coverage (R2)', () => {
  const client = new E2ETestClient();

  test('F2.1: Verified BMDC registration number is displayed on the public page', async () => {
    const res = await client.getRoute('/bn');
    assert.equal(res.status, 200);
    assert.match(res.body, /BMDC:\s*A-54321/);
  });

  test('F2.2: Doctor degrees and qualifications are rendered in Bengali and English', async () => {
    const resBn = await client.getRoute('/bn');
    assert.match(resBn.body, /এমবিবিএস,\s*এফসিপিএস/);

    const resEn = await client.getRoute('/en');
    assert.match(resEn.body, /MBBS,\s*FCPS/);
  });

  test('F2.3: Clinical experience metrics and stats are rendered in hero section', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /12\+\s*Years Experience/i);
    assert.match(res.body, /data-experience="12"/);
  });

  test('F2.4: Hero call-to-action button links to appointment booking page', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /href="\/bn\/appointment"/);
    assert.match(res.body, /Book Appointment/);
  });

  test('F2.5: Doctor credentials API exposes authoritative structured record', async () => {
    const creds = client.getDoctorCredentials();
    assert.equal(creds.bmdcRegNumber, 'A-54321');
    assert.equal(creds.experienceYears, 12);
    assert.equal(creds.totalPatientsTreated, 15000);
  });
});
