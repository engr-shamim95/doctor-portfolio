import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { UserRole } from '../harness/contracts.ts';

describe('Tier 2: F8 - Admin RBAC Role Boundaries (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B8.1: Unauthorized role attempting walk-in entry is rejected with 403 Forbidden', async () => {
    const res = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        patientName: 'Sneaky Patient',
        patientPhone: '01712345678',
        bookingMode: 'SLOT',
      },
      'unauthorized-role' as unknown as UserRole
    );
    assert.equal(res.status, 403);
    assert.equal((res.data as { error: string }).error, 'UNAUTHORIZED_ROLE');
  });

  test('B8.2: Assistant role attempting to mutate emergency medical disclaimer is rejected', () => {
    const ok = client.updateDoctorCredentials(
      { emergencyDisclaimerBn: 'Modified by assistant' },
      'assistant'
    );
    assert.equal(ok, false);
    assert.notEqual(client.getDoctorCredentials().emergencyDisclaimerBn, 'Modified by assistant');
  });

  test('B8.3: Super admin updates persist and record super-admin actor in audit history', () => {
    const ok = client.updateDoctorCredentials(
      { nameBn: 'ডাঃ মোসাদ্দেক হোসেন' },
      'super-admin'
    );
    assert.equal(ok, true);
    const logs = client.getAuditLogs({ entity: 'DoctorProfile' });
    const lastLog = logs[logs.length - 1];
    assert.equal(lastLog.userId, 'super-admin');
  });

  test('B8.4: Multiple successive role-based queries execute without session pollution', () => {
    // Super-admin succeeds
    assert.equal(client.updateDoctorCredentials({ experienceYears: 13 }, 'super-admin'), true);
    // Assistant fails
    assert.equal(client.updateDoctorCredentials({ experienceYears: 20 }, 'assistant'), false);
    // Doctor succeeds
    assert.equal(client.updateDoctorCredentials({ experienceYears: 14 }, 'doctor'), true);

    assert.equal(client.getDoctorCredentials().experienceYears, 14);
  });

  test('B8.5: Unauthenticated access to /admin/login serves authentication gateway', async () => {
    const res = await client.getRoute('/admin/login');
    assert.equal(res.status, 200);
    assert.match(res.body, /Payload CMS Login/);
  });
});
