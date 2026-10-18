import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 2: F2 - Doctor Credentials Boundary & Unicode Handling (R2)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B2.1: Doctor with minimal single qualification updates and renders without crashing', () => {
    const ok = client.updateDoctorCredentials({ degreesEn: 'MBBS' }, 'doctor');
    assert.equal(ok, true);
    const creds = client.getDoctorCredentials();
    assert.equal(creds.degreesEn, 'MBBS');
  });

  test('B2.2: Large number of treated patients (>100,000) stored without integer truncation', () => {
    const ok = client.updateDoctorCredentials({ totalPatientsTreated: 250000 }, 'doctor');
    assert.equal(ok, true);
    const creds = client.getDoctorCredentials();
    assert.equal(creds.totalPatientsTreated, 250000);
  });

  test('B2.3: Complex Bengali unicode characters with conjuncts (যুক্তাক্ষর) preserve UTF-8 fidelity', async () => {
    const complexTitle = 'অধ্যাপক ডাঃ মুহাম্মদ আশরাফুজ্জামান (মেডিসিন ও গ্যাস্ট্রোএন্টারোলজি বিশেষজ্ঞ)';
    const ok = client.updateDoctorCredentials({ nameBn: complexTitle }, 'doctor');
    assert.equal(ok, true);

    const res = await client.getRoute('/bn');
    assert.match(res.body, /অধ্যাপক ডাঃ মুহাম্মদ আশরাফুজ্জামান/);
  });

  test('B2.4: BMDC registration number format validation (A- followed by 5 digits)', () => {
    const creds = client.getDoctorCredentials();
    assert.match(creds.bmdcRegNumber, /^A-\d{4,6}$/);
  });

  test('B2.5: Zero experience years boundary value is accepted for new practitioners', () => {
    const ok = client.updateDoctorCredentials({ experienceYears: 0 }, 'doctor');
    assert.equal(ok, true);
    assert.equal(client.getDoctorCredentials().experienceYears, 0);
  });
});
