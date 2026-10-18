import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { generateSlotIntervals } from '../harness/timezone.ts';
import type { AvailabilityResponse, ChamberSchedule } from '../harness/contracts.ts';

describe('Tier 2: F10 - Schedule & Exceptions Boundaries (R3, R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('B10.1: Single-day leave exception blacks out only the target date and leaves adjacent dates intact', async () => {
    client.addLeave({
      id: 'leave-single-day',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      reason: 'Doctor Dental Appointment',
      allDay: true,
    });

    const dayBefore = await client.getAvailability('chamber-dhanmondi-1', '2026-10-26');
    assert.equal((dayBefore.data as AvailabilityResponse).slots?.length, 16);

    const leaveDay = await client.getAvailability('chamber-dhanmondi-1', '2026-10-27');
    assert.equal((leaveDay.data as AvailabilityResponse).slots?.length, 0);

    const dayAfter = await client.getAvailability('chamber-dhanmondi-1', '2026-10-28');
    assert.equal((dayAfter.data as AvailabilityResponse).slots?.length, 16);
  });

  test('B10.2: Month boundary spanning leave (Oct 31 to Nov 02) blacks out across month rollover', async () => {
    client.addLeave({
      id: 'leave-month-rollover',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-31',
      endDate: '2026-11-02',
      reason: 'Regional Workshop',
      allDay: true,
    });

    for (const d of ['2026-10-31', '2026-11-01', '2026-11-02']) {
      const res = await client.getAvailability('chamber-dhanmondi-1', d);
      assert.equal((res.data as AvailabilityResponse).slots?.length, 0);
    }

    // 2026-11-03 must be open
    const openRes = await client.getAvailability('chamber-dhanmondi-1', '2026-11-03');
    assert.equal((openRes.data as AvailabilityResponse).slots?.length, 16);
  });

  test('B10.3: Inactive chamber returns 404 CHAMBER_NOT_FOUND', async () => {
    const inactiveChamber: ChamberSchedule = {
      id: 'chamber-closed-temporarily',
      name: 'Closed Branch',
      address: 'Chittagong',
      city: 'Chittagong',
      bookingMode: 'SLOT',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '14:00',
      slotDurationMinutes: 15,
      maxPatients: 16,
      isActive: false, // Inactive
    };
    client.addSchedule(inactiveChamber);

    const res = await client.getAvailability('chamber-closed-temporarily', '2026-10-25');
    assert.equal(res.status, 404);
    assert.equal((res.data as { error: string }).error, 'CHAMBER_NOT_FOUND');
  });

  test('B10.4: Short 5-minute slot intervals generate exact high-frequency slots without drift', () => {
    // 18:00 to 19:00 = 60 mins / 5 mins = 12 slots
    const slots = generateSlotIntervals('2026-10-25', '18:00', '19:00', 5);
    assert.equal(slots.length, 12);
    assert.equal(slots[0].start, '2026-10-25T18:00:00+06:00');
    assert.equal(slots[0].end, '2026-10-25T18:05:00+06:00');
    assert.equal(slots[11].end, '2026-10-25T19:00:00+06:00');
  });

  test('B10.5: Chamber schedule retrieval returns undefined for non-existent chamber ID', () => {
    const schedule = client.getSchedule('does-not-exist-123');
    assert.equal(schedule, undefined);
  });
});
