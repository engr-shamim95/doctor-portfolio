import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 1: F8 - Admin Dashboard & RBAC Coverage (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F8.1: Accessing /admin route loads Payload CMS dashboard and login portal', async () => {
    const res = await client.getRoute('/admin');
    assert.equal(res.status, 200);
    assert.match(res.body, /payload-admin/);
    assert.match(res.body, /Payload CMS Login & Dashboard/);
  });

  test('F8.2: Super Admin role has permission to update doctor profile credentials', () => {
    const success = client.updateDoctorCredentials(
      { degreesEn: 'MBBS, MD, FCPS (Medicine)' },
      'super-admin'
    );
    assert.equal(success, true);
    const updated = client.getDoctorCredentials();
    assert.equal(updated.degreesEn, 'MBBS, MD, FCPS (Medicine)');
  });

  test('F8.3: Doctor role has permission to update doctor profile credentials', () => {
    const success = client.updateDoctorCredentials(
      { experienceYears: 15 },
      'doctor'
    );
    assert.equal(success, true);
    const updated = client.getDoctorCredentials();
    assert.equal(updated.experienceYears, 15);
  });

  test('F8.4: Assistant role is DENIED permission to modify doctor credentials (RBAC restriction)', () => {
    const success = client.updateDoctorCredentials(
      { bmdcRegNumber: 'A-99999' },
      'assistant'
    );
    assert.equal(success, false);
    // Credentials must remain unchanged
    const creds = client.getDoctorCredentials();
    assert.equal(creds.bmdcRegNumber, 'A-54321');
  });

  test('F8.5: Assistant role is permitted to create walk-in appointments', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T18:30:00+06:00',
        patientName: 'Walk-in Patient',
        patientPhone: '01855555555',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(walkInRes.status, 201);
    assert.equal((walkInRes.data as { status: string }).status, 'CONFIRMED');
  });
});
