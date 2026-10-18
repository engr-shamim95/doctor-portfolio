import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import type { AvailabilityResponse, ReservationResponse } from '../harness/contracts.ts';

describe('Tier 4 Scenario S3: Emergency Leave Declaration & Clinic Blackout', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('S3: Emergency leave declaration instantly blacks out public booking while retaining existing records for clinic staff', async () => {
    const leaveDate = '2026-10-26';

    // Step 1: Pre-existing patients book slots for tomorrow morning
    const bookedPatients = ['Patient Karim', 'Patient Fatema'];
    const bookedAppointmentIds: string[] = [];

    for (let i = 0; i < bookedPatients.length; i++) {
      const res = await client.reserveSlot({
        chamberId: 'chamber-dhanmondi-1',
        date: leaveDate,
        slotStart: `2026-10-26T17:${i === 0 ? '00' : '15'}:00+06:00`,
        patientName: bookedPatients[i],
        patientPhone: `0171234500${i}`,
        bookingMode: 'SLOT',
      });
      assert.equal(res.status, 201);
      const apptId = (res.data as ReservationResponse).appointmentId;
      await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
      bookedAppointmentIds.push(apptId);
    }

    // Step 2: Doctor logs into Admin and declares emergency medical leave for that entire day
    client.addLeave({
      id: 'leave-emergency-dhanmondi-1',
      chamberId: 'chamber-dhanmondi-1',
      startDate: leaveDate,
      endDate: leaveDate,
      reason: 'Urgent Medical Conference & Family Emergency',
      allDay: true,
    });

    // Step 3: Public availability immediately returns 0 open slots
    const availRes = await client.getAvailability('chamber-dhanmondi-1', leaveDate);
    assert.equal(availRes.status, 200);
    const availData = availRes.data as AvailabilityResponse;
    assert.equal(availData.slots?.length, 0);

    // Step 4: Clinic Assistant in Admin can still query the existing confirmed bookings to arrange rescheduling
    for (const apptId of bookedAppointmentIds) {
      const appt = client.getAppointmentById(apptId);
      assert.ok(appt);
      assert.equal(appt?.status, 'CONFIRMED');
      assert.equal(appt?.date, leaveDate);
    }

    // Step 5: Day after the leave (2026-10-27) remains completely normal and available
    const postLeaveAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-27');
    assert.equal(postLeaveAvail.status, 200);
    assert.equal((postLeaveAvail.data as AvailabilityResponse).slots?.length, 16);
  });
});
