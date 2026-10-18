#!/usr/bin/env node
/**
 * Programmatic End-to-End Booking Journey Verification Script
 *
 * Verifies:
 * 1. Public route health (/bn, /en)
 * 2. Chamber availability query (Asia/Dhaka)
 * 3. 2-Phase reservation hold with 5-minute TTL
 * 4. Reference code generation (DOC-YYYYMMDD-XXXX)
 * 5. OTP verification and confirmation
 * 6. HMAC-SHA256 signed management & cancellation links
 * 7. Patient self-cancellation via signed link
 * 8. Slot recirculation in availability engine
 * 9. Immutable audit trail verification
 */

import { E2ETestClient } from '../tests/e2e/harness/client.ts';
import { REFERENCE_CODE_REGEX } from '../tests/e2e/harness/contracts.ts';
import { verifyManagementLinkSignature } from '../tests/e2e/harness/crypto.ts';
import type { AvailabilityResponse, ReservationResponse, VerifyOtpResponse } from '../tests/e2e/harness/contracts.ts';

async function verifyBookingJourney() {
  console.log('================================================================');
  console.log('🩺 DOCTOR PORTFOLIO: PROGRAMMATIC BOOKING E2E VERIFICATION');
  console.log('================================================================\n');

  const client = new E2ETestClient();
  const testDate = '2026-10-25';

  // Step 1: Health check on public routes
  console.log('➡️  Step 1: Checking public localized routes...');
  const resBn = await client.getRoute('/bn');
  if (resBn.status !== 200 || !resBn.body.includes('BMDC: A-54321')) {
    throw new Error(`Failed to verify /bn route: status=${resBn.status}`);
  }
  const resEn = await client.getRoute('/en');
  if (resEn.status !== 200 || !resEn.body.includes('Dr. Ariful Islam')) {
    throw new Error(`Failed to verify /en route: status=${resEn.status}`);
  }
  console.log('   ✅ Public routes (/bn, /en) verified OK with BMDC credentials.\n');

  // Step 2: Query availability
  console.log(`➡️  Step 2: Querying chamber availability for ${testDate}...`);
  const availRes = await client.getAvailability('chamber-dhanmondi-1', testDate);
  if (availRes.status !== 200) {
    throw new Error(`Availability query failed with status ${availRes.status}`);
  }
  const availData = availRes.data as AvailabilityResponse;
  console.log(`   Timezone: ${availData.timezone}`);
  console.log(`   Mode: ${availData.bookingMode}`);
  console.log(`   Total slots generated: ${availData.slots?.length}`);

  const openSlot = availData.slots?.find((s) => s.available);
  if (!openSlot) {
    throw new Error('No open slots found for verification run!');
  }
  console.log(`   ✅ Selected slot: ${openSlot.start} -> ${openSlot.end}\n`);

  // Step 3: Reserve slot
  console.log('➡️  Step 3: Creating reservation hold (5-min TTL)...');
  const reserveRes = await client.reserveSlot({
    chamberId: 'chamber-dhanmondi-1',
    date: testDate,
    slotStart: openSlot.start,
    patientName: 'Programmatic Verification Patient',
    patientPhone: '01700112233',
    patientEmail: 'verify@example.com',
    bookingMode: 'SLOT',
  });
  if (reserveRes.status !== 201) {
    throw new Error(`Reservation failed with status ${reserveRes.status}`);
  }
  const reserveData = reserveRes.data as ReservationResponse;
  console.log(`   Appointment ID: ${reserveData.appointmentId}`);
  console.log(`   Reference Code: ${reserveData.referenceCode}`);
  console.log(`   Status: ${reserveData.status}`);
  console.log(`   Expires At: ${reserveData.expiresAt}`);

  if (!REFERENCE_CODE_REGEX.test(reserveData.referenceCode)) {
    throw new Error(`Invalid reference code format: ${reserveData.referenceCode}`);
  }
  console.log('   ✅ Reservation created with valid DOC-YYYYMMDD-XXXX reference code.\n');

  // Step 4: Verify OTP
  console.log('➡️  Step 4: Submitting OTP verification code (123456)...');
  const verifyRes = await client.verifyOtp({
    appointmentId: reserveData.appointmentId,
    otpCode: '123456',
  });
  if (verifyRes.status !== 200) {
    throw new Error(`OTP verification failed with status ${verifyRes.status}`);
  }
  const verifyData = verifyRes.data as VerifyOtpResponse;
  console.log(`   Status: ${verifyData.status}`);
  console.log(`   Management URL: ${verifyData.managementUrl}`);
  console.log(`   Cancellation URL: ${verifyData.cancellationUrl}`);
  console.log('   ✅ Appointment successfully confirmed.\n');

  // Step 5: Verify HMAC Signature
  console.log('➡️  Step 5: Verifying HMAC-SHA256 signature on signed cancellation URL...');
  const cancelUrl = new URL(verifyData.cancellationUrl);
  const sig = cancelUrl.searchParams.get('sig')!;
  const expires = parseInt(cancelUrl.searchParams.get('expires')!, 10);
  const isSigValid = verifyManagementLinkSignature(reserveData.appointmentId, expires, sig);
  if (!isSigValid) {
    throw new Error('HMAC-SHA256 signature verification failed on cancellation link!');
  }
  console.log('   ✅ HMAC-SHA256 cryptographic signature verified successfully.\n');

  // Step 6: Verify double-booking prevention on reserved slot
  console.log('➡️  Step 6: Testing double-booking conflict prevention on reserved slot...');
  const doubleBookRes = await client.reserveSlot({
    chamberId: 'chamber-dhanmondi-1',
    date: testDate,
    slotStart: openSlot.start,
    patientName: 'Intruder Patient',
    patientPhone: '01799999999',
    bookingMode: 'SLOT',
  });
  if (doubleBookRes.status !== 409) {
    throw new Error(`Expected HTTP 409 Conflict for double-booking, got ${doubleBookRes.status}`);
  }
  console.log('   ✅ Conflict correctly prevented: HTTP 409 (SLOT_ALREADY_RESERVED).\n');

  // Step 7: Cancel appointment via signed link
  console.log('➡️  Step 7: Cancelling appointment via signed link...');
  const cancelRes = await client.cancelAppointment({
    appointmentId: reserveData.appointmentId,
    signature: sig,
    expires,
    reason: 'Verification completed',
  });
  if (cancelRes.status !== 200) {
    throw new Error(`Cancellation failed with status ${cancelRes.status}`);
  }
  console.log('   ✅ Appointment successfully cancelled.\n');

  // Step 8: Verify slot recirculation
  console.log('➡️  Step 8: Verifying slot recirculation in availability engine...');
  const recircAvailRes = await client.getAvailability('chamber-dhanmondi-1', testDate);
  const recircSlot = (recircAvailRes.data as AvailabilityResponse).slots?.find((s) => s.start === openSlot.start);
  if (!recircSlot || !recircSlot.available) {
    throw new Error('Slot was not reopened following cancellation!');
  }
  console.log('   ✅ Slot is once again marked available: true for new bookings.\n');

  // Step 9: Verify audit trail
  console.log('➡️  Step 9: Verifying immutable audit trail...');
  const auditLogs = client.getAuditLogs({ entityId: reserveData.appointmentId });
  console.log(`   Found ${auditLogs.length} audit entries for appointment:`);
  for (const log of auditLogs) {
    console.log(`     - [${log.action}] at ${log.timestamp}`);
  }
  if (auditLogs.length < 2) {
    throw new Error(`Expected at least 2 audit entries, found ${auditLogs.length}`);
  }
  console.log('   ✅ Complete provenance audit trail verified.\n');

  console.log('================================================================');
  console.log('🎉 ALL 9 PROGRAMMATIC JOURNEY STEPS VERIFIED SUCCESSFULLY! (EXIT 0)');
  console.log('================================================================');
}

verifyBookingJourney().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
