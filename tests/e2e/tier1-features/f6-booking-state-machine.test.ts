import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../harness/contracts.ts';
import type { ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 1: F6 - Booking State Machine Coverage (R3)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F6.1: Reservation creates record with status PENDING, reference code, and 5-min TTL', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:00:00+06:00',
      patientName: 'Kazi Nazrul',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });

    assert.equal(res.status, 201);
    const data = res.data as ReservationResponse;
    assert.equal(data.status, 'PENDING');
    assert.match(data.referenceCode, REFERENCE_CODE_REGEX);
    assert.ok(data.appointmentId);
    assert.equal(data.otpSent, true);

    const expiresAt = new Date(data.expiresAt).getTime();
    const now = Date.now();
    assert.ok(expiresAt > now);
    assert.ok(expiresAt <= now + 5 * 60 * 1000 + 1000);
  });

  test('F6.2: Correct OTP submission transitions status from PENDING to CONFIRMED', async () => {
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:15:00+06:00',
      patientName: 'Kazi Nazrul',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });

    const reserveData = reserveRes.data as ReservationResponse;
    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '123456',
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = verifyRes.data as VerifyOtpResponse;
    assert.equal(verifyData.status, 'CONFIRMED');
    assert.equal(verifyData.referenceCode, reserveData.referenceCode);
  });

  test('F6.3: Confirmed booking response provides valid signed management and cancellation URLs', async () => {
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:30:00+06:00',
      patientName: 'Kazi Nazrul',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });

    const reserveData = reserveRes.data as ReservationResponse;
    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '123456',
    });

    const verifyData = verifyRes.data as VerifyOtpResponse;
    assert.ok(verifyData.managementUrl.includes('/appointment/manage'));
    assert.ok(verifyData.cancellationUrl.includes('action=cancel'));
    assert.ok(verifyData.managementUrl.includes('sig='));
    assert.ok(verifyData.cancellationUrl.includes('sig='));
  });

  test('F6.4: Submitting an invalid OTP returns 400 Bad Request with error INVALID_OTP', async () => {
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:45:00+06:00',
      patientName: 'Kazi Nazrul',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });

    const reserveData = reserveRes.data as ReservationResponse;
    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '999999', // Wrong OTP
    });

    assert.equal(verifyRes.status, 400);
    assert.equal((verifyRes.data as { error: string }).error, 'INVALID_OTP');
  });

  test('F6.5: Attempting OTP verification after TTL expiry returns 410 RESERVATION_EXPIRED', async () => {
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:00:00+06:00',
      patientName: 'Late Patient',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });

    const reserveData = reserveRes.data as ReservationResponse;

    // Simulate TTL expiry (set expiresAt in past)
    client.setAppointmentTtl(reserveData.appointmentId, Date.now() - 1000);

    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '123456',
    });

    assert.equal(verifyRes.status, 410);
    assert.equal((verifyRes.data as { error: string }).error, 'RESERVATION_EXPIRED');
  });
});
