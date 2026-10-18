import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../harness/contracts.ts';
import { verifyManagementLinkSignature } from '../harness/crypto.ts';
import type { AvailabilityResponse, ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 4 Scenario S1: Full New Patient Online Discovery & Booking Journey', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('S1: End-to-end patient flow: discovery -> schedule inspect -> reserve -> OTP -> signed links', async () => {
    // Step 1: Patient discovers doctor on localized homepage
    const homeRes = await client.getRoute('/bn');
    assert.equal(homeRes.status, 200);
    assert.match(homeRes.body, /BMDC:\s*A-54321/);
    assert.match(homeRes.body, /href="\/bn\/appointment"/);

    // Step 2: Patient inspects chamber visiting hours on /bn/chambers
    const chamberRes = await client.getRoute('/bn/chambers');
    assert.equal(chamberRes.status, 200);
    assert.match(chamberRes.body, /Dhanmondi Chamber/);

    // Step 3: Patient opens booking wizard and queries availability for 2026-10-25
    const availRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    assert.equal(availRes.status, 200);
    const availData = availRes.data as AvailabilityResponse;
    assert.equal(availData.timezone, 'Asia/Dhaka');
    assert.ok(availData.slots && availData.slots.length > 0);

    const targetSlot = availData.slots.find((s) => s.available);
    assert.ok(targetSlot, 'At least one slot must be available');

    // Step 4: Patient submits reservation form with phone and name
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: targetSlot.start,
      patientName: 'Kazi Nazrul Islam',
      patientPhone: '01712345678',
      patientEmail: 'patient@example.com',
      bookingMode: 'SLOT',
    });
    assert.equal(reserveRes.status, 201);
    const reserveData = reserveRes.data as ReservationResponse;
    assert.equal(reserveData.status, 'PENDING');
    assert.match(reserveData.referenceCode, REFERENCE_CODE_REGEX);
    assert.equal(reserveData.otpSent, true);

    // Step 5: Patient submits OTP code received via SMS/mock
    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '123456',
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = verifyRes.data as VerifyOtpResponse;
    assert.equal(verifyData.status, 'CONFIRMED');
    assert.equal(verifyData.referenceCode, reserveData.referenceCode);

    // Step 6: Patient receives signed management and cancellation links
    assert.ok(verifyData.managementUrl.includes('/appointment/manage'));
    assert.ok(verifyData.cancellationUrl.includes('action=cancel'));

    const parsedCancel = new URL(verifyData.cancellationUrl);
    const sig = parsedCancel.searchParams.get('sig')!;
    const expires = parseInt(parsedCancel.searchParams.get('expires')!, 10);
    const isValidSig = verifyManagementLinkSignature(reserveData.appointmentId, expires, sig);
    assert.equal(isValidSig, true, 'Cancellation link must contain valid HMAC-SHA256 signature');

    // Step 7: Verify slot is now reserved in availability
    const postAvailRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const updatedSlot = (postAvailRes.data as AvailabilityResponse).slots?.find((s) => s.start === targetSlot.start);
    assert.equal(updatedSlot?.available, false);
  });
});
