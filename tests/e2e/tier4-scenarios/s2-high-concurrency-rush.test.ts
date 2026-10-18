import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { ReservationResponse } from '../harness/contracts.ts';

describe('Tier 4 Scenario S2: High-Concurrency Booking Rush (20 Simultaneous Requests)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('S2: 20 patients compete simultaneously for identical slot; strictly 1 confirmation, 19 conflicts', async () => {
    const slot = '2026-10-25T17:00:00+06:00';
    const patientCount = 20;

    const bookingRequests = Array.from({ length: patientCount }).map((_, idx) =>
      client.reserveSlot({
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: slot,
        patientName: `Rush Patient #${idx + 1}`,
        patientPhone: `017000000${String(idx).padStart(2, '0')}`,
        bookingMode: 'SLOT',
      })
    );

    // Fire all 20 requests concurrently
    const responses = await Promise.all(bookingRequests);

    const successfulBookings = responses.filter((r) => r.status === 201);
    const conflictingBookings = responses.filter((r) => r.status === 409);

    assert.equal(successfulBookings.length, 1, 'Exactly one patient must win the reservation');
    assert.equal(conflictingBookings.length, 19, 'Exactly 19 patients must receive HTTP 409 conflict');

    // Confirm the winning reservation
    const winnerData = successfulBookings[0].data as ReservationResponse;
    const verifyRes = await client.verifyOtp({
      appointmentId: winnerData.appointmentId,
      otpCode: '123456',
    });
    assert.equal(verifyRes.status, 200);

    // Verify all 19 conflicting requests received authoritative error code
    for (const conflict of conflictingBookings) {
      assert.equal((conflict.data as { error: string }).error, 'SLOT_ALREADY_RESERVED');
    }
  });
});
