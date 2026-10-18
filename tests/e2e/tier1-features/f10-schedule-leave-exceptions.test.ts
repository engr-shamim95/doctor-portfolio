import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { AvailabilityResponse } from '../harness/contracts.ts';

describe('Tier 1: F10 - Schedule & Leave/Holiday Exceptions (R3, R4)', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('F10.1: Declaring all-day leave for a chamber blacks out all slots on that date', async () => {
    // Before leave: slots are open
    const beforeRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-26');
    assert.equal(beforeRes.status, 200);
    const beforeData = beforeRes.data as AvailabilityResponse;
    assert.ok((beforeData.slots?.length ?? 0) > 0);

    // Add holiday/leave
    client.addLeave({
      id: 'leave-eid-1',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-26',
      endDate: '2026-10-26',
      reason: 'National Holiday',
      allDay: true,
    });

    // After leave: slots should be completely empty (0 slots available)
    const afterRes = await client.getAvailability('chamber-dhanmondi-1', '2026-10-26');
    assert.equal(afterRes.status, 200);
    const afterData = afterRes.data as AvailabilityResponse;
    assert.equal(afterData.slots?.length, 0);
  });

  test('F10.2: Regular schedule operates normally on dates outside the leave period', async () => {
    client.addLeave({
      id: 'leave-eid-2',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-26',
      endDate: '2026-10-26',
      reason: 'National Holiday',
      allDay: true,
    });

    // Next day (2026-10-27) should be fully open
    const resNextDay = await client.getAvailability('chamber-dhanmondi-1', '2026-10-27');
    assert.equal(resNextDay.status, 200);
    const dataNextDay = resNextDay.data as AvailabilityResponse;
    assert.equal(dataNextDay.slots?.length, 16);
    assert.ok(dataNextDay.slots?.every((s) => s.available));
  });

  test('F10.3: Multi-day vacation leave blacks out consecutive days accurately', async () => {
    client.addLeave({
      id: 'leave-conference',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      reason: 'Medical Conference in Singapore',
      allDay: true,
    });

    for (const date of ['2026-11-01', '2026-11-02', '2026-11-03']) {
      const res = await client.getAvailability('chamber-dhanmondi-1', date);
      assert.equal(res.status, 200);
      assert.equal((res.data as AvailabilityResponse).slots?.length, 0);
    }

    // 2026-11-04 is available
    const postRes = await client.getAvailability('chamber-dhanmondi-1', '2026-11-04');
    assert.equal(postRes.status, 200);
    assert.equal((postRes.data as AvailabilityResponse).slots?.length, 16);
  });

  test('F10.4: Serial mode chamber on leave returns available: false and maxPatients: 0', async () => {
    client.addLeave({
      id: 'leave-serial-chamber',
      chamberId: 'chamber-uttara-serial',
      startDate: '2026-10-28',
      endDate: '2026-10-28',
      reason: 'Chamber Renovation',
      allDay: true,
    });

    const res = await client.getAvailability('chamber-uttara-serial', '2026-10-28');
    assert.equal(res.status, 200);
    const data = res.data as AvailabilityResponse;
    assert.equal(data.serials?.available, false);
    assert.equal(data.serials?.maxPatients, 0);
  });

  test('F10.5: Leave management API allows staff to retrieve registered leaves for chamber', () => {
    client.addLeave({
      id: 'leave-1',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      reason: 'Annual Leave',
      allDay: true,
    });

    const dhanmondiLeaves = client.getLeaves('chamber-dhanmondi-1');
    assert.equal(dhanmondiLeaves.length, 1);
    assert.equal(dhanmondiLeaves[0].reason, 'Annual Leave');

    const uttaraLeaves = client.getLeaves('chamber-uttara-serial');
    assert.equal(uttaraLeaves.length, 0);
  });
});
