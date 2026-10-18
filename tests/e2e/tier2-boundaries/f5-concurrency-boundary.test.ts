import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { ReservationResponse, VerifyOtpResponse } from '../harness/contracts.ts';

describe('Tier 2: F5 - Concurrency & Race Condition Boundaries (R3, R5)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B5.1: 10 simultaneous requests for the exact same slot yield strictly 1 success (201) and 9 conflicts (409)', async () => {
    const slot = '2026-10-25T17:00:00+06:00';
    const concurrentRequests = Array.from({ length: 10 }).map((_, idx) =>
      client.reserveSlot({
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: slot,
        patientName: `Contender ${idx + 1}`,
        patientPhone: `0171111111${idx}`,
        bookingMode: 'SLOT',
      })
    );

    const results = await Promise.all(concurrentRequests);
    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    assert.equal(successes.length, 1);
    assert.equal(conflicts.length, 9);
    for (const c of conflicts) {
      assert.equal((c.data as { error: string }).error, 'SLOT_ALREADY_RESERVED');
    }
  });

  test('B5.2: Serial capacity race: 2 simultaneous requests when 1 slot remains produce 1 success and 1 409', async () => {
    // Fill 9 slots out of 10 in chamber-uttara-serial
    for (let i = 0; i < 9; i++) {
      await client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: `Initial Patient ${i + 1}`,
        patientPhone: `0181111111${i}`,
        bookingMode: 'SERIAL',
      });
    }

    // Now 2 patients race for the 10th and final serial
    const [race1, race2] = await Promise.all([
      client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: 'Racer 1',
        patientPhone: '01899999991',
        bookingMode: 'SERIAL',
      }),
      client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: 'Racer 2',
        patientPhone: '01899999992',
        bookingMode: 'SERIAL',
      }),
    ]);

    const statuses = [race1.status, race2.status].sort();
    assert.deepEqual(statuses, [201, 409]);
  });

  test('B5.3: Concurrency on different chambers at the identical timestamp execute without blocking', async () => {
    const timeIso = '2026-10-25T18:00:00+06:00';
    const [res1, res2] = await Promise.all([
      client.reserveSlot({
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: timeIso,
        patientName: 'Patient Dhanmondi',
        patientPhone: '01711111111',
        bookingMode: 'SLOT',
      }),
      client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: 'Patient Uttara',
        patientPhone: '01822222222',
        bookingMode: 'SERIAL',
      }),
    ]);

    assert.equal(res1.status, 201);
    assert.equal(res2.status, 201);
  });

  test('B5.4: Cancellation frees up slot allowing immediate subsequent reservation', async () => {
    const slot = '2026-10-25T17:15:00+06:00';
    const reserve1 = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Original Patient',
      patientPhone: '01733333333',
      bookingMode: 'SLOT',
    });
    const apptId = (reserve1.data as ReservationResponse).appointmentId;

    // Confirm booking to get cancellation URL
    const verifyRes = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    const verifyData = verifyRes.data as VerifyOtpResponse;

    const cancelUrl = new URL(verifyData.cancellationUrl);
    await client.cancelAppointment({
      appointmentId: apptId,
      signature: cancelUrl.searchParams.get('sig')!,
      expires: parseInt(cancelUrl.searchParams.get('expires')!, 10),
    });

    // Now second patient reserves the exact same slot
    const reserve2 = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'New Patient',
      patientPhone: '01744444444',
      bookingMode: 'SLOT',
    });

    assert.equal(reserve2.status, 201);
    assert.equal((reserve2.data as ReservationResponse).status, 'PENDING');
  });

  test('B5.5: Expired pending hold allows second patient to reserve previously held slot', async () => {
    const slot = '2026-10-25T17:30:00+06:00';
    const firstReserve = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Abandoning Patient',
      patientPhone: '01755555555',
      bookingMode: 'SLOT',
    });
    const firstId = (firstReserve.data as ReservationResponse).appointmentId;

    // Expire first reservation TTL
    client.setAppointmentTtl(firstId, Date.now() - 5000);

    // Second patient attempts to reserve
    const secondReserve = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Prompt Patient',
      patientPhone: '01766666666',
      bookingMode: 'SLOT',
    });

    assert.equal(secondReserve.status, 201);
  });
});
