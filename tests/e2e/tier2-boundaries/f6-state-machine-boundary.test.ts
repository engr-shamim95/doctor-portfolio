import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { ReservationResponse } from '../harness/contracts.ts';

describe('Tier 2: F6 - Booking State Machine Boundary Conditions (R3)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B6.1: Max OTP retry boundary: 5 wrong attempts return 400; 6th attempt triggers 429 rate limit', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:00:00+06:00',
      patientName: 'Retry Patient',
      patientPhone: '01712341234',
      bookingMode: 'SLOT',
    });
    const apptId = (res.data as ReservationResponse).appointmentId;

    // Attempts 1 to 5
    for (let i = 1; i <= 5; i++) {
      const wrongAttempt = await client.verifyOtp({ appointmentId: apptId, otpCode: `00000${i}` });
      assert.equal(wrongAttempt.status, 400);
      assert.equal((wrongAttempt.data as { error: string }).error, 'INVALID_OTP');
    }

    // Attempt 6 should exceed max attempts and trigger 429
    const sixthAttempt = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    assert.equal(sixthAttempt.status, 429);
    assert.equal((sixthAttempt.data as { error: string }).error, 'TOO_MANY_OTP_ATTEMPTS');
  });

  test('B6.2: Verifying non-existent appointment ID returns 404 Not Found', async () => {
    const res = await client.verifyOtp({
      appointmentId: 'non-existent-guid-0000',
      otpCode: '123456',
    });
    assert.equal(res.status, 404);
    assert.equal((res.data as { error: string }).error, 'APPOINTMENT_NOT_FOUND');
  });

  test('B6.3: Idempotency check: verifying OTP on already CONFIRMED appointment returns 400', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:15:00+06:00',
      patientName: 'Double Confirm Patient',
      patientPhone: '01712341235',
      bookingMode: 'SLOT',
    });
    const apptId = (res.data as ReservationResponse).appointmentId;

    // First confirm succeeds
    const firstConfirm = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    assert.equal(firstConfirm.status, 200);

    // Second confirm rejected as invalid status
    const secondConfirm = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    assert.equal(secondConfirm.status, 400);
    assert.equal((secondConfirm.data as { error: string }).error, 'INVALID_STATUS_FOR_OTP');
  });

  test('B6.4: Reservation with empty patient name is rejected with 400 Bad Request', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:30:00+06:00',
      patientName: '',
      patientPhone: '01712341236',
      bookingMode: 'SLOT',
    });
    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'INVALID_PATIENT_INFO');
  });

  test('B6.5: Reservation with all-whitespace phone number is rejected with 400 Bad Request', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:45:00+06:00',
      patientName: 'Whitespace Phone',
      patientPhone: '         ',
      bookingMode: 'SLOT',
    });
    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'INVALID_PATIENT_INFO');
  });
});
