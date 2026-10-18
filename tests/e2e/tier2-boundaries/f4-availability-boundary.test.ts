import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { generateSlotIntervals, getDhakaDateTime, parseDhakaSlot } from '../harness/timezone.ts';
import type { AvailabilityResponse } from '../harness/contracts.ts';

describe('Tier 2: F4 - Availability Engine Timezone & Slot Boundaries (R3)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B4.1: Midnight UTC vs Asia/Dhaka (+06:00): 23:30 UTC on 2026-10-24 maps to 05:30 on 2026-10-25 in Dhaka', () => {
    const utcDate = new Date('2026-10-24T23:30:00.000Z');
    const dhaka = getDhakaDateTime(utcDate);
    assert.equal(dhaka.dateString, '2026-10-25');
    assert.equal(dhaka.timeString, '05:30');
  });

  test('B4.2: First slot begins exactly at chamber start time (17:00:00+06:00)', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const data = res.data as AvailabilityResponse;
    const firstSlot = data.slots?.[0];
    assert.ok(firstSlot);
    assert.equal(firstSlot.start, '2026-10-25T17:00:00+06:00');
    assert.equal(firstSlot.end, '2026-10-25T17:15:00+06:00');
  });

  test('B4.3: Last slot ends exactly at chamber closing time without overrunning (21:00:00+06:00)', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const data = res.data as AvailabilityResponse;
    const lastSlot = data.slots?.[data.slots.length - 1];
    assert.ok(lastSlot);
    assert.equal(lastSlot.start, '2026-10-25T20:45:00+06:00');
    assert.equal(lastSlot.end, '2026-10-25T21:00:00+06:00');
  });

  test('B4.4: Inverted or zero schedule window (start >= end) returns empty slot array', () => {
    const invertedSlots = generateSlotIntervals('2026-10-25', '21:00', '17:00', 15);
    assert.equal(invertedSlots.length, 0);

    const zeroDurationSlots = generateSlotIntervals('2026-10-25', '17:00', '21:00', 0);
    assert.equal(zeroDurationSlots.length, 0);
  });

  test('B4.5: Slots with remainder duration exclude partial overrun slots', () => {
    // 17:00 to 18:20 with 30m slots: 17:00-17:30, 17:30-18:00 (2 slots). 18:00-18:30 overruns 18:20, so omitted.
    const slots = generateSlotIntervals('2026-10-25', '17:00', '18:20', 30);
    assert.equal(slots.length, 2);
    assert.equal(slots[0].start, '2026-10-25T17:00:00+06:00');
    assert.equal(slots[1].end, '2026-10-25T18:00:00+06:00');
  });
});
