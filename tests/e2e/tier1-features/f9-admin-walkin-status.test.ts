import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../harness/contracts.ts';
import type { WalkInResponse } from '../harness/contracts.ts';

describe('Tier 1: F9 - Admin Walk-in Quick Entry & Status Transitions (R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F9.1: Assistant creates walk-in appointment directly in CONFIRMED status without requiring OTP', async () => {
    const res = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T18:45:00+06:00',
        patientName: 'Tareq Masud',
        patientPhone: '01911111111',
        bookingMode: 'SLOT',
      },
      'assistant'
    );

    assert.equal(res.status, 201);
    const data = res.data as WalkInResponse;
    assert.equal(data.status, 'CONFIRMED');
    assert.match(data.referenceCode, REFERENCE_CODE_REGEX);
  });

  test('F9.2: Walk-in appointment correctly reserves slot against public availability', async () => {
    const slot = '2026-10-25T19:00:00+06:00';
    await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: slot,
        patientName: 'Humayun Ahmed',
        patientPhone: '01922222222',
        bookingMode: 'SLOT',
      },
      'assistant'
    );

    const availRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const slotItem = (availRes.data as { slots: Array<{ start: string; available: boolean }> }).slots.find(
      (s) => s.start === slot
    );
    assert.ok(slotItem);
    assert.equal(slotItem.available, false);
  });

  test('F9.3: Admin updates appointment status from CONFIRMED to COMPLETED after consultation', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T19:15:00+06:00',
        patientName: 'Zahir Raihan',
        patientPhone: '01933333333',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    const appointmentId = (walkInRes.data as WalkInResponse).appointmentId;

    const updateRes = await client.updateAppointmentStatus(appointmentId, 'COMPLETED', 'doctor');
    assert.equal(updateRes.status, 200);
    assert.equal((updateRes.data as { status: string }).status, 'COMPLETED');

    const appt = client.getAppointmentById(appointmentId);
    assert.equal(appt?.status, 'COMPLETED');
  });

  test('F9.4: Admin marks absent patient as NO_SHOW', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T19:30:00+06:00',
        patientName: 'Absent Patient',
        patientPhone: '01944444444',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    const appointmentId = (walkInRes.data as WalkInResponse).appointmentId;

    const updateRes = await client.updateAppointmentStatus(appointmentId, 'NO_SHOW', 'assistant');
    assert.equal(updateRes.status, 200);
    assert.equal((updateRes.data as { status: string }).status, 'NO_SHOW');
  });

  test('F9.5: Invalid backward status transition from COMPLETED to PENDING is rejected with 400', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T19:45:00+06:00',
        patientName: 'Consulted Patient',
        patientPhone: '01955555555',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    const appointmentId = (walkInRes.data as WalkInResponse).appointmentId;

    await client.updateAppointmentStatus(appointmentId, 'COMPLETED', 'doctor');

    // Attempt invalid reverse transition
    const invalidRes = await client.updateAppointmentStatus(appointmentId, 'PENDING', 'doctor');
    assert.equal(invalidRes.status, 400);
    assert.equal((invalidRes.data as { error: string }).error, 'INVALID_STATUS_TRANSITION');
  });
});
