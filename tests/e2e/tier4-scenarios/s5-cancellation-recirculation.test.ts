import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { AvailabilityResponse, ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 4 Scenario S5: Patient Self-Service Signed Cancellation & Slot Recirculation', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('S5: Complete lifecycle of booking, cancellation via signed HMAC link, and subsequent re-booking by another patient', async () => {
    const slot = '2026-10-25T19:30:00+06:00';

    // Step 1: Patient 1 books and confirms appointment
    const reserve1 = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Original Booked Patient',
      patientPhone: '01711223300',
      bookingMode: 'SLOT',
    });
    assert.equal(reserve1.status, 201);
    const apptId1 = (reserve1.data as ReservationResponse).appointmentId;

    const verify1 = await client.verifyOtp({ appointmentId: apptId1, otpCode: '123456' });
    assert.equal(verify1.status, 200);
    const cancellationUrl = (verify1.data as VerifyOtpResponse).cancellationUrl;

    // Step 2: Slot is confirmed unavailable for everyone else
    const midAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const midSlot = (midAvail.data as AvailabilityResponse).slots?.find((s) => s.start === slot);
    assert.equal(midSlot?.available, false);

    // Step 3: Patient 2 attempts to book the slot and gets 409 Conflict
    const conflictAttempt = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Hopeful Patient',
      patientPhone: '01711223388',
      bookingMode: 'SLOT',
    });
    assert.equal(conflictAttempt.status, 409);

    // Step 4: Patient 1 clicks cancellation link in SMS/Email
    const parsedUrl = new URL(cancellationUrl);
    const sig = parsedUrl.searchParams.get('sig')!;
    const expires = parseInt(parsedUrl.searchParams.get('expires')!, 10);

    const cancelRes = await client.cancelAppointment({
      appointmentId: apptId1,
      signature: sig,
      expires,
      reason: 'Schedule conflict, need to travel',
    });
    assert.equal(cancelRes.status, 200);
    assert.equal((cancelRes.data as { status: string }).status, 'CANCELLED');

    // Step 5: Public availability engine immediately recirculates slot as available: true
    const postCancelAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const postSlot = (postCancelAvail.data as AvailabilityResponse).slots?.find((s) => s.start === slot);
    assert.equal(postSlot?.available, true);

    // Step 6: Patient 2 successfully books the recirculated slot
    const reserve2 = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Hopeful Patient',
      patientPhone: '01711223388',
      bookingMode: 'SLOT',
    });
    assert.equal(reserve2.status, 201);
    const apptId2 = (reserve2.data as ReservationResponse).appointmentId;

    const verify2 = await client.verifyOtp({ appointmentId: apptId2, otpCode: '123456' });
    assert.equal(verify2.status, 200);
    assert.equal((verify2.data as VerifyOtpResponse).status, 'CONFIRMED');

    // Step 7: Final check confirms slot is once again reserved
    const finalAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const finalSlot = (finalAvail.data as AvailabilityResponse).slots?.find((s) => s.start === slot);
    assert.equal(finalSlot?.available, false);
  });
});
