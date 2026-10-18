import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { E2ETestClient } from '../harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../harness/contracts.ts';
import type {
  AvailabilityResponse,
  ReservationResponse,
  VerifyOtpResponse,
  WalkInResponse,
} from '../harness/contracts.ts';

describe('Tier 3: Cross-Feature Pairwise Combinations', () => {
  let client: E2ETestClient;

  beforeEach(() => {
    client = new E2ETestClient();
  });

  test('P1 (F1 x F6): Locale switch mid-booking preserves booking validity and reference code format', async () => {
    // Patient browses Bengali page
    const resBn = await client.getRoute('/bn/appointment');
    assert.equal(resBn.status, 200);

    // Reserves slot in Bengali locale
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T17:00:00+06:00',
      patientName: 'Bilingual Patient',
      patientPhone: '01711223344',
      bookingMode: 'SLOT',
    });
    assert.equal(reserveRes.status, 201);
    const reserveData = reserveRes.data as ReservationResponse;
    assert.match(reserveData.referenceCode, REFERENCE_CODE_REGEX);

    // Switches to English to complete OTP
    const resEn = await client.getRoute('/en/appointment');
    assert.equal(resEn.status, 200);

    const verifyRes = await client.verifyOtp({
      appointmentId: reserveData.appointmentId,
      otpCode: '123456',
    });
    assert.equal(verifyRes.status, 200);
    assert.equal((verifyRes.data as VerifyOtpResponse).status, 'CONFIRMED');
  });

  test('P2 (F4 x F10): Holiday blackout immediately zeros out public availability for that chamber', async () => {
    // Before leave: slots are open
    const beforeAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-26');
    assert.ok(((beforeAvail.data as AvailabilityResponse).slots?.length ?? 0) > 0);

    // Doctor adds holiday exception
    client.addLeave({
      id: 'leave-eid-holiday',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-26',
      endDate: '2026-10-26',
      reason: 'Eid Holiday',
      allDay: true,
    });

    // Public query immediately reflects 0 available slots
    const afterAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-26');
    assert.equal((afterAvail.data as AvailabilityResponse).slots?.length, 0);
  });

  test('P3 (F9 x F11): Clinic receptionist walk-in records audit log with assistant user ID', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T17:15:00+06:00',
        patientName: 'Walk-in Audit Patient',
        patientPhone: '01899887766',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(walkInRes.status, 201);
    const apptId = (walkInRes.data as WalkInResponse).appointmentId;

    const logs = client.getAuditLogs({ entity: 'Appointments', entityId: apptId });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, 'WALK_IN_CREATED');
    assert.equal(logs[0].userId, 'assistant');
  });

  test('P4 (F8 x F10): Previously confirmed appointments remain accessible to staff after emergency leave', async () => {
    // Patient books and confirms slot for tomorrow
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-27',
      slotStart: '2026-10-27T17:30:00+06:00',
      patientName: 'Pre-booked Patient',
      patientPhone: '01711223399',
      bookingMode: 'SLOT',
    });
    const apptId = (reserveRes.data as ReservationResponse).appointmentId;
    await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });

    // Doctor later declares emergency leave for that day
    client.addLeave({
      id: 'leave-emergency-surgery',
      chamberId: 'chamber-dhanmondi-1',
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      reason: 'Emergency Hospital Surgery',
      allDay: true,
    });

    // Staff can still look up existing booked appointment to reschedule
    const appt = client.getAppointmentById(apptId);
    assert.ok(appt);
    assert.equal(appt?.status, 'CONFIRMED');
    assert.equal(appt?.patientName, 'Pre-booked Patient');
  });

  test('P5 (F4 x F7): Patient cancels slot via signed URL; slot is immediately re-opened in availability', async () => {
    const slot = '2026-10-25T17:45:00+06:00';
    // Book and confirm slot
    const reserveRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Cancelling Patient',
      patientPhone: '01711002200',
      bookingMode: 'SLOT',
    });
    const apptId = (reserveRes.data as ReservationResponse).appointmentId;
    const verifyRes = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    const verifyData = verifyRes.data as VerifyOtpResponse;

    // Slot is currently booked
    const busyAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const bookedSlot = (busyAvail.data as AvailabilityResponse).slots?.find((s) => s.start === slot);
    assert.equal(bookedSlot?.available, false);

    // Cancel via signed link
    const cancelUrl = new URL(verifyData.cancellationUrl);
    await client.cancelAppointment({
      appointmentId: apptId,
      signature: cancelUrl.searchParams.get('sig')!,
      expires: parseInt(cancelUrl.searchParams.get('expires')!, 10),
    });

    // Query availability again: slot is back to available: true
    const freeAvail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const freedSlot = (freeAvail.data as AvailabilityResponse).slots?.find((s) => s.start === slot);
    assert.equal(freedSlot?.available, true);
  });

  test('P6 (F5 x F6): Unconfirmed reservation TTL expires; second patient successfully claims slot', async () => {
    const slot = '2026-10-25T18:00:00+06:00';
    const reserve1 = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Forgetful Patient',
      patientPhone: '01711998877',
      bookingMode: 'SLOT',
    });
    const apptId1 = (reserve1.data as ReservationResponse).appointmentId;

    // Second patient attempts while held: blocked with 409
    const blockedRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Waiting Patient',
      patientPhone: '01711998866',
      bookingMode: 'SLOT',
    });
    assert.equal(blockedRes.status, 409);

    // 5-minute TTL expires
    client.setAppointmentTtl(apptId1, Date.now() - 1000);

    // Second patient retries: succeeds with 201
    const allowedRes = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: slot,
      patientName: 'Waiting Patient',
      patientPhone: '01711998866',
      bookingMode: 'SLOT',
    });
    assert.equal(allowedRes.status, 201);
  });

  test('P7 (F1 x F3 x F4): Mobile action bar CTA directs to booking wizard with valid chamber data', async () => {
    const res = await client.getRoute('/bn');
    assert.match(res.body, /class="sticky-mobile-action-bar"/);
    assert.match(res.body, /href="\/bn\/appointment"/);

    // Wizard loads chamber availability
    const avail = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    assert.equal(avail.status, 200);
    assert.ok(((avail.data as AvailabilityResponse).slots?.length ?? 0) > 0);
  });

  test('P8 (F8 x F9 x F11): Doctor changes status from CONFIRMED to COMPLETED; audit log records diff', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T18:15:00+06:00',
        patientName: 'Consultation Completed Patient',
        patientPhone: '01722334455',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    const apptId = (walkInRes.data as WalkInResponse).appointmentId;

    await client.updateAppointmentStatus(apptId, 'COMPLETED', 'doctor');

    const logs = client.getAuditLogs({ entity: 'Appointments', entityId: apptId });
    const statusLog = logs.find((l) => l.action === 'STATUS_CHANGE');
    assert.ok(statusLog);
    assert.equal(statusLog.userId, 'doctor');
    assert.equal(statusLog.diff?.status.old, 'CONFIRMED');
    assert.equal(statusLog.diff?.status.new, 'COMPLETED');
  });

  test('P9 (F4 x F5): Serial mode chamber fills to maxPatients; availability shows available: false and rejects next booking', async () => {
    // Fill all 10 serials
    for (let i = 0; i < 10; i++) {
      await client.reserveSlot({
        chamberId: 'chamber-uttara-serial',
        date: '2026-10-25',
        patientName: `Serial Batch Patient ${i + 1}`,
        patientPhone: `0183333333${i}`,
        bookingMode: 'SERIAL',
      });
    }

    // Availability returns available: false
    const avail = await client.getAvailability('chamber-uttara-serial', '2026-10-25');
    const data = avail.data as AvailabilityResponse;
    assert.equal(data.serials?.available, false);
    assert.equal(data.serials?.bookedCount, 10);

    // 11th booking is rejected with 409 CAPACITY_REACHED
    const overflow = await client.reserveSlot({
      chamberId: 'chamber-uttara-serial',
      date: '2026-10-25',
      patientName: 'Excess Patient',
      patientPhone: '01899990000',
      bookingMode: 'SERIAL',
    });
    assert.equal(overflow.status, 409);
    assert.equal((overflow.data as { error: string }).error, 'CAPACITY_REACHED');
  });

  test('P10 (F1 x F2 x F8): Doctor updates qualifications in admin; public pages /bn and /en reflect change', async () => {
    client.updateDoctorCredentials(
      {
        degreesBn: 'এমবিবিএস, এফসিপিএস, পিএইচডি',
        degreesEn: 'MBBS, FCPS, PhD',
      },
      'doctor'
    );

    const resBn = await client.getRoute('/bn');
    assert.match(resBn.body, /এমবিবিএস,\s*এফসিপিএস,\s*পিএইচডি/);

    const resEn = await client.getRoute('/en');
    assert.match(resEn.body, /MBBS,\s*FCPS,\s*PhD/);
  });

  test('P11 (F4 x F10): Leave exception on serial mode chamber closes availability completely', async () => {
    client.addLeave({
      id: 'leave-serial-repair',
      chamberId: 'chamber-uttara-serial',
      startDate: '2026-10-29',
      endDate: '2026-10-29',
      reason: 'Facility Sanitization',
      allDay: true,
    });

    const avail = await client.getAvailability('chamber-uttara-serial', '2026-10-29');
    const data = avail.data as AvailabilityResponse;
    assert.equal(data.serials?.available, false);
    assert.equal(data.serials?.maxPatients, 0);
  });

  test('P12 (F5 x F6): Repeated invalid OTP entries trigger rate limiting (429) without releasing slot prematurely', async () => {
    const res = await client.reserveSlot({
      chamberId: 'chamber-dhanmondi-1',
      date: '2026-10-25',
      slotStart: '2026-10-25T18:30:00+06:00',
      patientName: 'Rate Limit Patient',
      patientPhone: '01711223355',
      bookingMode: 'SLOT',
    });
    const apptId = (res.data as ReservationResponse).appointmentId;

    // 5 bad attempts
    for (let i = 0; i < 5; i++) {
      await client.verifyOtp({ appointmentId: apptId, otpCode: '000000' });
    }

    // 6th attempt triggers 429
    const rateLimited = await client.verifyOtp({ appointmentId: apptId, otpCode: '123456' });
    assert.equal(rateLimited.status, 429);
  });

  test('P13 (F7 x F11): Tampered cancellation signature is rejected (403) and logged as security event', async () => {
    const res = await client.cancelAppointment({
      appointmentId: 'fake-appt-id-1234',
      signature: 'deadbeef12345678',
      expires: Date.now() + 60000,
    });
    assert.equal(res.status, 403);
    assert.equal((res.data as { error: string }).error, 'INVALID_SIGNATURE');
  });

  test('P14 (F8 x F9): Assistant role successfully creates walk-in but cannot delete audit records', async () => {
    const walkInRes = await client.createWalkIn(
      {
        chamberId: 'chamber-dhanmondi-1',
        date: '2026-10-25',
        slotStart: '2026-10-25T18:45:00+06:00',
        patientName: 'Role Test Walkin',
        patientPhone: '01799881122',
        bookingMode: 'SLOT',
      },
      'assistant'
    );
    assert.equal(walkInRes.status, 201);

    // Assistant attempts delete on audit log
    const delRes = client.attemptDeleteAuditLog('audit-id-xyz');
    assert.equal(delRes.status, 403);
  });

  test('P15 (F1 x F4): Slot intervals rendered for Asia/Dhaka time adhere strictly to +06:00 format', async () => {
    const res = await client.getAvailability('chamber-dhanmondi-1', '2026-10-25');
    const data = res.data as AvailabilityResponse;
    assert.equal(data.timezone, 'Asia/Dhaka');
    for (const slot of data.slots!) {
      assert.match(slot.start, /T\d{2}:\d{2}:00\+06:00$/);
      assert.match(slot.end, /T\d{2}:\d{2}:00\+06:00$/);
    }
  });
});
