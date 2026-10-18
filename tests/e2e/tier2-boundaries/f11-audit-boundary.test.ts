import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { ReservationResponse } from '../harness/contracts.ts';

describe('Tier 2: F11 - Audit Log Immutability & Filter Boundaries (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B11.1: Audit log objects are frozen and immune to runtime parameter mutation', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:00:00+06:00',
      patientName: 'Immutable Patient',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });
    const apptId = (res.data as ReservationResponse).appointmentId;

    const logs = client.getAuditLogs({ entityId: apptId });
    assert.equal(logs.length, 1);
    assert.ok(Object.isFrozen(logs[0]));

    // Attempting to modify frozen audit log property should fail in strict mode
    assert.throws(() => {
      // @ts-expect-error Testing runtime immutability
      logs[0].action = 'TAMPERED';
    }, TypeError);
  });

  test('B11.2: System TTL reaper records system actor identifier', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:15:00+06:00',
      patientName: 'Reaper Patient',
      patientPhone: '01712345679',
      bookingMode: 'SLOT',
    });
    const apptId = (res.data as ReservationResponse).appointmentId;

    // Expire TTL and trigger reaper
    client.setAppointmentTtl(apptId, Date.now() - 1000);
    const reapedCount = client.reapExpiredReservations();
    assert.equal(reapedCount, 1);

    const logs = client.getAuditLogs({ entityId: apptId });
    const reaperLog = logs.find((l) => l.action === 'STATUS_CHANGE');
    assert.ok(reaperLog);
    assert.equal(reaperLog.userId, 'system:ttl-reaper');
  });

  test('B11.3: Querying audit logs for non-existent entity returns empty array', () => {
    const logs = client.getAuditLogs({ entity: 'NonExistentCollection' });
    assert.deepEqual(logs, []);
  });

  test('B11.4: High-volume sequence of actions preserves chronological timestamp ordering', async () => {
    for (let i = 0; i < 5; i++) {
      client.updateDoctorCredentials({ experienceYears: 10 + i }, 'doctor');
    }

    const logs = client.getAuditLogs({ entity: 'DoctorProfile' });
    assert.equal(logs.length, 5);

    for (let i = 1; i < logs.length; i++) {
      const prevTime = new Date(logs[i - 1].timestamp).getTime();
      const currTime = new Date(logs[i].timestamp).getTime();
      assert.ok(currTime >= prevTime);
    }
  });

  test('B11.5: Delete attempt with empty string or arbitrary ID is rejected uniformly with 403', () => {
    const res1 = client.attemptDeleteAuditLog('');
    assert.equal(res1.status, 403);
    assert.equal(res1.error, 'AUDIT_LOGS_ARE_IMMUTABLE');

    const res2 = client.attemptDeleteAuditLog('random-uuid-1234');
    assert.equal(res2.status, 403);
    assert.equal(res2.error, 'AUDIT_LOGS_ARE_IMMUTABLE');
  });
});
