import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';

describe('Tier 1: F5 - Concurrency & Double-Booking Prevention (R3, R5)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F5.1: Database partial unique index simulation ensures exactly 1 success and 1 conflict (409) on concurrent booking', async () => {
    const slot = '2026-10-25T18:00:00+06:00';
    const req1 = {
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Patient Alice',
      patientPhone: '01711111111',
      bookingMode: 'SLOT' as const,
    };
    const req2 = {
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Patient Bob',
      patientPhone: '01722222222',
      bookingMode: 'SLOT' as const,
    };

    // Execute concurrently
    const [res1, res2] = await Promise.all([client.reserveSlot(req1), client.reserveSlot(req2)]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 409]);

    const conflictRes = res1.status === 409 ? res1 : res2;
    assert.equal((conflictRes.data as { error: string }).error, 'SLOT_ALREADY_RESERVED');
  });

  test('F5.2: Concurrent bookings for different distinct slots all succeed with 201 Created', async () => {
    const slots = [
      '2026-10-25T17:00:00+06:00',
      '2026-10-25T17:15:00+06:00',
      '2026-10-25T17:30:00+06:00',
    ];

    const promises = slots.map((slot, idx) =>
      client.reserveSlot({
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: slot,
        patientName: `Patient ${idx + 1}`,
        patientPhone: `0173333333${idx}`,
        bookingMode: 'SLOT',
      })
    );

    const results = await Promise.all(promises);
    for (const res of results) {
      assert.equal(res.status, 201);
    }
  });

  test('F5.3: SERIAL mode fills up to maxPatients capacity and rejects the overflow request with 409', async () => {
    // chamber-uttara-serial has maxPatients = 10
    const serialPromises = Array.from({ length: 10 }).map((_, idx) =>
      client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: `Serial Patient ${idx + 1}`,
        patientPhone: `0180000000${idx}`,
        bookingMode: 'SERIAL',
      })
    );

    const initialResults = await Promise.all(serialPromises);
    for (const res of initialResults) {
      assert.equal(res.status, 201);
    }

    // 11th request must be rejected with 409 CAPACITY_REACHED
    const overflowRes = await client.reserveSlot({
      chamberId: 'chamber-uttara-serial',
      date: '2026-10-25',
      patientName: 'Overflow Patient',
      patientPhone: '01899999999',
      bookingMode: 'SERIAL',
    });

    assert.equal(overflowRes.status, 409);
    assert.equal((overflowRes.data as { error: string }).error, 'CAPACITY_REACHED');
  });

  test('F5.4: Reservation with missing or invalid phone number is rejected with 400 Bad Request', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T19:00:00+06:00',
      patientName: 'Invalid Phone',
      patientPhone: '123', // Too short
      bookingMode: 'SLOT',
    });

    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'INVALID_PATIENT_INFO');
  });

  test('F5.5: Slot in SLOT mode requires explicit slotStart parameter', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      patientName: 'No Slot Patient',
      patientPhone: '01711111111',
      bookingMode: 'SLOT',
    });

    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'SLOT_START_REQUIRED');
  });
});
