import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../harness/contracts.ts';
import type { WalkInResponse } from '../harness/contracts.ts';

describe('Tier 4 Scenario S4: Clinic Receptionist Walk-in & Consultation Lifecycle', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('S4: Receptionist creates walk-in entry, doctor conducts visit, status moves to COMPLETED with full audit trail', async () => {
    // Step 1: Clinic assistant logs in and accesses admin panel
    const adminRes = await client.getRoute('/admin');
    assert.equal(adminRes.status, 200);

    // Step 2: Patient arrives at front desk; assistant enters walk-in record without OTP
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T19:00:00+06:00',
        patientName: 'Anisul Hoque',
        patientPhone: '01811223344',
        patientEmail: 'anisul@example.com',
        notes: 'Walk-in arrival with severe migraine symptoms',
        bookingMode: 'SLOT',
      },
      'assistant'
    );

    assert.equal(walkInRes.status, 201);
    const walkInData = walkInRes.data as WalkInResponse;
    assert.equal(walkInData.status, 'CONFIRMED');
    assert.match(walkInData.referenceCode, REFERENCE_CODE_REGEX);
    const appointmentId = walkInData.appointmentId;

    // Step 3: Verify audit log recorded the assistant walk-in entry
    const auditLogsAfterCreate = client.getAuditLogs({ entity: 'Appointments', entityId: appointmentId });
    assert.equal(auditLogsAfterCreate.length, 1);
    assert.equal(auditLogsAfterCreate[0].action, 'WALK_IN_CREATED');
    assert.equal(auditLogsAfterCreate[0].userId, 'assistant');

    // Step 4: Doctor calls patient into consultation room and marks appointment COMPLETED
    const completeRes = await client.updateAppointmentStatus(appointmentId, 'COMPLETED', 'doctor');
    assert.equal(completeRes.status, 200);
    assert.equal((completeRes.data as { status: string }).status, 'COMPLETED');

    // Step 5: Verify final state in appointments registry
    const apptRecord = client.getAppointmentById(appointmentId);
    assert.equal(apptRecord?.status, 'COMPLETED');

    // Step 6: Verify audit trail contains complete provenance (creation by assistant, completion by doctor)
    const finalAuditLogs = client.getAuditLogs({ entity: 'Appointments', entityId: appointmentId });
    assert.equal(finalAuditLogs.length, 2);

    const completionLog = finalAuditLogs.find((l) => l.action === 'STATUS_CHANGE');
    assert.ok(completionLog);
    assert.equal(completionLog.userId, 'doctor');
    assert.deepEqual(completionLog.diff, {
      status: { old: 'CONFIRMED', new: 'COMPLETED' },
    });
  });
});
