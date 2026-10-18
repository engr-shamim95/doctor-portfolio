import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { ReservationResponse } from '../harness/contracts.ts';

describe('Tier 1: F11 - Immutable Audit Logging Coverage (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F11.1: Appointment creation automatically records an audit log entry', async () => {
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T20:00:00+06:00',
      patientName: 'Audit Test Patient',
      patientPhone: '01711223344',
      bookingMode: 'SLOT',
    });
    const appointmentId = (reserveRes.data as ReservationResponse).appointmentId;

    const logs = client.getAuditLogs({ entity: 'Appointments', entityId: appointmentId });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, 'CREATE');
    assert.equal(logs[0].entityId, appointmentId);
    assert.ok(logs[0].timestamp);
  });

  test('F11.2: Status change records actor user ID and before/after state diff', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T20:15:00+06:00',
        patientName: 'Diff Test Patient',
        patientPhone: '01755667788',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    const appointmentId = (walkInRes.data as { appointmentId: string }).appointmentId;

    await client.updateAppointmentStatus(appointmentId, 'COMPLETED', 'doctor');

    const logs = client.getAuditLogs({ entity: 'Appointments', entityId: appointmentId });
    const statusChangeLog = logs.find((l) => l.action === 'STATUS_CHANGE');
    assert.ok(statusChangeLog);
    assert.equal(statusChangeLog.userId, 'doctor');
    assert.deepEqual(statusChangeLog.diff, {
      status: { old: 'CONFIRMED', new: 'COMPLETED' },
    });
  });

  test('F11.3: Creating a leave exception automatically registers an audit log record', () => {
    client.addLeave({
      id: 'leave-audit-test',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-12-25',
      endDate: '2026-12-25',
      reason: 'Christmas Holiday',
      allDay: true,
    });

    const logs = client.getAuditLogs({ entity: 'Leaves', entityId: 'leave-audit-test' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, 'CREATE');
    assert.equal(logs[0].metadata?.reason, 'Christmas Holiday');
  });

  test('F11.4: Direct deletion of audit log entries is strictly forbidden (Immutability guarantee)', () => {
    const deleteAttempt = client.attemptDeleteAuditLog('some-log-id');
    assert.equal(deleteAttempt.status, 403);
    assert.equal(deleteAttempt.error, 'AUDIT_LOGS_ARE_IMMUTABLE');
  });

  test('F11.5: Filtering audit logs by entity isolates relevant domain events', async () => {
    // Perform appointment action
    await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T20:30:00+06:00',
      patientName: 'Filter Test Patient',
      patientPhone: '01799887766',
      bookingMode: 'SLOT',
    });

    // Perform doctor profile update
    client.updateDoctorCredentials({ experienceYears: 14 }, 'doctor');

    const apptLogs = client.getAuditLogs({ entity: 'Appointments' });
    const profileLogs = client.getAuditLogs({ entity: 'DoctorProfile' });

    assert.ok(apptLogs.every((l) => l.entity === 'Appointments'));
    assert.ok(profileLogs.every((l) => l.entity === 'DoctorProfile'));
    assert.ok(profileLogs.length >= 1);
  });
});
