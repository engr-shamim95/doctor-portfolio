import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { signManagementLink, verifyManagementLinkSignature } from '../harness/crypto.ts';
import type { ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 2: F7 - Signed Links Cryptographic & Expiry Boundaries (R3)', () => {
  let client: E2ETestClient;
  let appointmentId: string;

  beforeEach(async () => {
    client = new E2ETestClient();
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:00:00+06:00',
      patientName: 'Crypto Test Patient',
      patientPhone: '01712345678',
      bookingMode: 'SLOT',
    });
    appointmentId = (reserveRes.data as ReservationResponse).appointmentId;
    await client.verifyOtp({ appointmentId, otpCode: '123456' });
  });

  test('B7.1: Expiration timestamp set to 0 is strictly rejected with 403 LINK_EXPIRED', async () => {
    const sig = signManagementLink(appointmentId, 0);
    const res = await client.cancelAppointment({
      appointmentId,
      signature: sig,
      expires: 0,
    });
    assert.equal(res.status, 403);
    assert.equal((res.data as { error: string }).error, 'LINK_EXPIRED');
  });

  test('B7.2: Truncated or odd-length hex signature string handled safely without unhandled error', async () => {
    const truncatedSig = 'abc12';
    const res = await client.cancelAppointment({
      appointmentId,
      signature: truncatedSig,
      expires: Date.now() + 60000,
    });
    assert.equal(res.status, 403);
    assert.equal((res.data as { error: string }).error, 'INVALID_SIGNATURE');
  });

  test('B7.3: Signature generated using mismatched secret key is strictly rejected', async () => {
    const expires = Date.now() + 60000;
    const rogueSig = signManagementLink(appointmentId, expires, 'attacker-unauthorized-secret-key!');
    const res = await client.cancelAppointment({
      appointmentId,
      signature: rogueSig,
      expires,
    });
    assert.equal(res.status, 403);
    assert.equal((res.data as { error: string }).error, 'INVALID_SIGNATURE');
  });

  test('B7.4: Verification exactly at expiration boundary: 1ms before expires succeeds', () => {
    const futureExpires = Date.now() + 5000;
    const sig = signManagementLink('test-appt-id', futureExpires);
    const isValid = verifyManagementLinkSignature('test-appt-id', futureExpires, sig);
    assert.equal(isValid, true);
  });

  test('B7.5: Verification exactly at expiration boundary: 1ms past expires fails', () => {
    const pastExpires = Date.now() - 1;
    const sig = signManagementLink('test-appt-id', pastExpires);
    const isValid = verifyManagementLinkSignature('test-appt-id', pastExpires, sig);
    assert.equal(isValid, false);
  });
});
