import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { AvailabilityResponse } from '../harness/contracts.ts';

describe('Tier 1: F4 - Availability Engine Coverage (R3)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F4.1: Querying availability for SLOT mode chamber returns Asia/Dhaka timezone and slot array', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    assert.equal(res.status, 200);
    const data = res.data as AvailabilityResponse;
    assert.equal(data.timezone, 'Asia/Dhaka');
    assert.equal(data.bookingMode, 'SLOT');
    assert.ok(Array.isArray(data.slots));
    assert.ok(data.slots.length > 0);
  });

  test('F4.2: Slot duration (15m) generates exact interval count between start (17:00) and end (21:00)', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    assert.equal(res.status, 200);
    const data = res.data as AvailabilityResponse;
    // 4 hours * 4 slots/hr = 16 slots
    assert.equal(data.slots?.length, 16);
    assert.ok(data.slots[0].start.includes('T17:00:00+06:00'));
    assert.ok(data.slots[15].start.includes('T20:45:00+06:00'));
    assert.ok(data.slots[15].end.includes('T21:00:00+06:00'));
  });

  test('F4.3: Querying SERIAL mode chamber returns serial capacity and next available serial', async () => {
    const res = await client.getAvailability('chamber-uttara-serial', '2026-10-25');
    assert.equal(res.status, 200);
    const data = res.data as AvailabilityResponse;
    assert.equal(data.bookingMode, 'SERIAL');
    assert.ok(data.serials);
    assert.equal(data.serials.maxPatients, 10);
    assert.equal(data.serials.bookedCount, 0);
    assert.equal(data.serials.available, true);
    assert.equal(data.serials.nextSerial, 1);
  });

  test('F4.4: Active reservation marks the corresponding slot as unavailable', async () => {
    const slotToBook = '2026-10-25T17:00:00+06:00';
    // Reserve slot
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slotToBook,
      patientName: 'Rahim Khan',
      patientPhone: '01711111111',
      bookingMode: 'SLOT',
    });
    assert.equal(reserveRes.status, 201);

    // Query availability
    const availRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const data = availRes.data as AvailabilityResponse;
    const reservedSlot = data.slots?.find((s) => s.start === slotToBook);
    assert.ok(reservedSlot);
    assert.equal(reservedSlot.available, false);

    // Other slots remain available
    const otherSlot = data.slots?.find((s) => s.start !== slotToBook);
    assert.ok(otherSlot);
    assert.equal(otherSlot.available, true);
  });

  test('F4.5: Querying past date in Asia/Dhaka time returns 400 Bad Request', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2020-01-01');
    assert.equal(res.status, 400);
    assert.equal((res.data as { error: string }).error, 'PAST_DATE_NOT_ALLOWED');
  });

  test('F4.6: Querying invalid or unknown chamber ID returns 404 Not Found', async () => {
    const res = await client.getAvailability('non-existent-chamber-xyz', '2026-10-25');
    assert.equal(res.status, 404);
    assert.equal((res.data as { error: string }).error, 'CHAMBER_NOT_FOUND');
  });
});
