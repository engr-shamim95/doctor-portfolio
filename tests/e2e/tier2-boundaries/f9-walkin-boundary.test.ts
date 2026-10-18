import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { WalkInResponse } from '../harness/contracts.ts';

describe('Tier 2: F9 - Admin Walk-in Quick Entry Boundaries (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B9.1: Walk-in request with missing phone number returns 400 MISSING_REQUIRED_FIELDS', async () => {
    const res = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        patientName: 'No Phone Patient',
        patientPhone: '',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'MISSING_REQUIRED_FIELDS');
  });

  test('B9.2: Walk-in to non-existent chamber returns 404 CHAMBER_NOT_FOUND', async () => {
    const res = await client.createWalkIn(
      {
        chamberId: 'invalid-chamber-id',
        date: '2026-10-25',
        patientName: 'Valid Name',
        patientPhone: '01712345678',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(res.status, 404);
    assert.equal((res.data as { error: string }).error, 'CHAMBER_NOT_FOUND');
  });

  test('B9.3: Walk-in notes containing SQL special characters are stored verbatim without syntax mutation', async () => {
    const maliciousNote = "'; DROP TABLE appointments; -- <script>alert(1)</script>";
    const res = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T18:00:00+06:00',
        patientName: 'Security Audit Patient',
        patientPhone: '01712345678',
        notes: maliciousNote,
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(res.status, 201);
    const apptId = (res.data as WalkInResponse).appointmentId;
    const appt = client.getAppointmentById(apptId);
    assert.equal(appt?.notes, maliciousNote);
  });

  test('B9.4: Serial mode walk-in when capacity is reached returns 409 CAPACITY_REACHED', async () => {
    // Fill all 10 serials in chamber-uttara-serial
    for (let i = 0; i < 10; i++) {
      await client.createWalkIn(
        {
          chamberId: 'chamber-uttara-serial',
          date: '2026-10-25',
          patientName: `Serial ${i + 1}`,
          patientPhone: `0171234000${i}`,
          bookingMode: 'SERIAL',
        },
        'assistant'
      );
    }

    // 11th walk-in fails
    const overflow = await client.createWalkIn(
      {
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: '11th Walk-in',
        patientPhone: '01799999999',
        bookingMode: 'SERIAL',
      },
      'assistant'
    );
    assert.equal(overflow.status, 409);
    assert.equal((overflow.data as { error: string }).error, 'CAPACITY_REACHED');
  });

  test('B9.5: Updating status of non-existent appointment ID returns 404 APPOINTMENT_NOT_FOUND', async () => {
    const res = await client.updateAppointmentStatus('non-existent-appt-id', 'COMPLETED', 'doctor');
    assert.equal(res.status, 404);
    assert.equal((res.data as { error: string }).error, 'APPOINTMENT_NOT_FOUND');
  });
});
