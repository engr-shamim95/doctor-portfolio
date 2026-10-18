import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { signManagementLink, verifyManagementLinkSignature } from '../harness/crypto.ts';
import type { ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 1: F7 - Signed Cancellation & Management Links (R3)', () => {
  let client: E2ETestClient;
  let appointmentId: string;
  let cancellationUrl: string;

  beforeEach(async () => {
    client = new E2ETestClient();
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:15:00+06:00',
      patientName: 'Shamsur Rahman',
      patientPhone: '01719999999',
      bookingMode: 'SLOT',
    });
    const reserveData = reserveRes.data as ReservationResponse;
    appointmentId = reserveData.appointmentId;

    const verifyRes = await client.verifyOtp({
      appointmentId,
      otpCode: '123456',
    });
    const verifyData = verifyRes.data as VerifyOtpResponse;
    cancellationUrl = verifyData.cancellationUrl;
  });

  test('F7.1: Cancellation via valid signed link transitions status to CANCELLED', async () => {
    const url = new URL(cancellationUrl);
    const id = url.searchParams.get('id')!;
    const sig = url.searchParams.get('sig')!;
    const expires = parseInt(url.searchParams.get('expires')!, 10);

    const cancelRes = await client.cancelAppointment({
      appointmentId: id,
      signature: sig,
      expires,
      reason: 'Personal reasons',
    });

    assert.equal(cancelRes.status, 200);
    assert.equal((cancelRes.data as { status: string }).status, 'CANCELLED');

    const appt = client.getAppointmentById(id);
    assert.equal(appt?.status, 'CANCELLED');
  });

  test('F7.2: Tampered HMAC signature is rejected with 403 Forbidden', async () => {
    const url = new URL(cancellationUrl);
    const id = url.searchParams.get('id')!;
    const expires = parseInt(url.searchParams.get('expires')!, 10);
    const tamperedSig = 'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';

    const cancelRes = await client.cancelAppointment({
      appointmentId: id,
      signature: tamperedSig,
      expires,
    });

    assert.equal(cancelRes.status, 403);
    assert.equal((cancelRes.data as { error: string }).error, 'INVALID_SIGNATURE');
  });

  test('F7.3: Expired link signature (expires < Date.now()) is rejected with 403 LINK_EXPIRED', async () => {
    const pastExpires = Date.now() - 10000; // 10s in past
    const validSigForPast = signManagementLink(appointmentId, pastExpires);

    const cancelRes = await client.cancelAppointment({
      appointmentId,
      signature: validSigForPast,
      expires: pastExpires,
    });

    assert.equal(cancelRes.status, 403);
    assert.equal((cancelRes.data as { error: string }).error, 'LINK_EXPIRED');
  });

  test('F7.4: Valid signature for one appointment cannot be reused on a different appointment ID', async () => {
    const otherId = '00000000-0000-0000-0000-000000000000';
    const url = new URL(cancellationUrl);
    const sig = url.searchParams.get('sig')!;
    const expires = parseInt(url.searchParams.get('expires')!, 10);

    const cancelRes = await client.cancelAppointment({
      appointmentId: otherId,
      signature: sig,
      expires,
    });

    assert.equal(cancelRes.status, 403);
    assert.equal((cancelRes.data as { error: string }).error, 'INVALID_SIGNATURE');
  });

  test('F7.5: Signature validator helper correctly verifies matching payload and secret', () => {
    const expires = Date.now() + 60000;
    const sig = signManagementLink('appt-123', expires);
    const isValid = verifyManagementLinkSignature('appt-123', expires, sig);
    assert.equal(isValid, true);

    const isInvalid = verifyManagementLinkSignature('appt-123', expires, 'invalidsig');
    assert.equal(isInvalid, false);
  });
});
