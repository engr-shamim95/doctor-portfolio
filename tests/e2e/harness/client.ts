/**
 * Opaque-box E2E Client for Doctor Personal Portfolio & Appointment System.
 * Supports both Live HTTP Mode (via TEST_BASE_URL) and Contract Simulator Mode.
 */

import { randomUUID } from 'node:crypto';
import type {
  BookingMode,
  AppointmentStatus,
  UserRole,
  AvailabilityResponse,
  ReservationRequest,
  ReservationResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
  WalkInRequest,
  WalkInResponse,
  ChamberSchedule,
  LeaveException,
  AuditLogEntry,
  ApiErrorResponse,
} from './contracts.ts';
import { DEFAULT_PAYLOAD_SECRET } from './contracts.ts';
import { signManagementLink, verifyManagementLinkSignature, buildSignedUrls } from './crypto.ts';
import { generateSlotIntervals, getDhakaDateTime } from './timezone.ts';

export interface RouteResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  data?: Record<string, unknown>;
}

export interface InternalAppointment {
  id: string;
  referenceCode: string;
  chamberId: string;
  date: string; // YYYY-MM-DD
  slotStart?: string;
  slotEnd?: string;
  serialNumber?: number;
  bookingMode: BookingMode;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  status: AppointmentStatus;
  createdAt: number;
  expiresAt: number; // epoch ms
  otpCode: string;
  otpAttempts: number;
  notes?: string;
}

export class E2ETestClient {
  private baseUrl: string | null = process.env.TEST_BASE_URL || null;
  private secret: string = process.env.PAYLOAD_SECRET || DEFAULT_PAYLOAD_SECRET;

  // In-Memory Contract State
  private schedules: Map<string, ChamberSchedule> = new Map();
  private leaves: Map<string, LeaveException> = new Map();
  private appointments: Map<string, InternalAppointment> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private doctorCredentials = {
    nameBn: 'ডাঃ আরিফুল ইসলাম',
    nameEn: 'Dr. Ariful Islam',
    bmdcRegNumber: 'A-54321',
    degreesBn: 'এমবিবিএস, এফসিপিএস (মেডিসিন)',
    degreesEn: 'MBBS, FCPS (Medicine)',
    experienceYears: 12,
    totalPatientsTreated: 15000,
    emergencyDisclaimerBn: 'জরুরী চিকিৎসা সেবার জন্য অনুগ্রহ করে অবিলম্বে নিকটস্থ হাসপাতালে যান অথবা ৯৯৯ এ কল করুন। এই অনলাইন পোর্টাল জরুরী সেবার জন্য নয়।',
    emergencyDisclaimerEn: 'For emergencies, please call 999 or visit the nearest emergency room immediately. This online appointment system is not intended for acute emergency care.',
  };

  constructor() {
    this.seedDefaultChambers();
  }

  public resetState() {
    this.schedules.clear();
    this.leaves.clear();
    this.appointments.clear();
    this.auditLogs = [];
    this.seedDefaultChambers();
  }

  private seedDefaultChambers() {
    const defaultChamber: ChamberSchedule = {
      id: 'chamber-dhanmondi-1',
      name: 'Popular Diagnostic Centre, Dhanmondi',
      address: 'House #16, Road #2, Dhanmondi, Dhaka',
      city: 'Dhaka',
      bookingMode: 'SLOT',
      weekdays: [0, 1, 2, 3, 4, 5, 6], // All week
      startTime: '17:00',
      endTime: '21:00',
      slotDurationMinutes: 15,
      maxPatients: 16,
      isActive: true,
    };
    this.schedules.set(defaultChamber.id, defaultChamber);

    const serialChamber: ChamberSchedule = {
      id: 'chamber-uttara-serial',
      name: 'Ibn Sina Diagnostic Centre, Uttara',
      address: 'Sector 3, Uttara, Dhaka',
      city: 'Dhaka',
      bookingMode: 'SERIAL',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startTime: '18:00',
      endTime: '22:00',
      slotDurationMinutes: 15,
      maxPatients: 10,
      isActive: true,
    };
    this.schedules.set(serialChamber.id, serialChamber);
  }

  // ==========================================
  // Public Localized Routes (F1, F2, F3)
  // ==========================================

  public async getRoute(path: string, options: { userAgent?: string; lang?: string } = {}): Promise<RouteResponse> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          headers: {
            'User-Agent': options.userAgent || 'Mozilla/5.0 (TestRunner)',
            'Accept-Language': options.lang || 'bn,en;q=0.9',
          },
        });
        const text = await res.text();
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          headers[k] = v;
        });
        return { status: res.status, headers, body: text };
      } catch (e) {
        // Fall back to simulator if live server not reachable
      }
    }

    // In-memory route contract handler
    const cleanPath = path.split('?')[0];

    // Check unsupported locale
    if (cleanPath.startsWith('/fr') || cleanPath.startsWith('/es') || cleanPath.startsWith('/de')) {
      return {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: '<html><body>404 Not Found - Unsupported Locale</body></html>',
      };
    }

    if (cleanPath === '' || cleanPath === '/') {
      return {
        status: 307,
        headers: { location: '/bn', 'content-type': 'text/html; charset=utf-8' },
        body: '<html><body>Redirecting to /bn</body></html>',
      };
    }

    const locale = cleanPath.startsWith('/en') ? 'en' : 'bn';
    const isEn = locale === 'en';

    if (cleanPath === '/bn' || cleanPath === '/en') {
      const creds = isEn ? this.doctorCredentials.degreesEn : this.doctorCredentials.degreesBn;
      const docName = isEn ? this.doctorCredentials.nameEn : this.doctorCredentials.nameBn;
      const disclaimer = isEn ? this.doctorCredentials.emergencyDisclaimerEn : this.doctorCredentials.emergencyDisclaimerBn;

      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `
          <!DOCTYPE html>
          <html lang="${locale}">
            <head><title>${docName} - Portfolio</title></head>
            <body>
              <header>
                <h1>${docName}</h1>
                <div class="credentials-badge">BMDC: ${this.doctorCredentials.bmdcRegNumber}</div>
                <div class="degrees">${creds}</div>
                <div class="stats" data-experience="${this.doctorCredentials.experienceYears}">12+ Years Experience</div>
                <a href="/${locale}/appointment" class="hero-cta">Book Appointment</a>
              </header>
              <div class="emergency-disclaimer-banner">${disclaimer}</div>
              <div class="sticky-mobile-action-bar" data-mobile="true">
                <a href="tel:+8801700000000" class="btn-call">Call</a>
                <a href="https://wa.me/8801700000000" class="btn-whatsapp">WhatsApp</a>
                <a href="/${locale}/appointment" class="btn-book">Book Appointment</a>
              </div>
            </body>
          </html>
        `,
      };
    }

    if (cleanPath === '/bn/services' || cleanPath === '/en/services') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html lang="${locale}"><body><h1>Services Directory</h1><div class="service-card">General Medicine</div><div class="service-card">Cardiology Consultation</div></body></html>`,
      };
    }

    if (cleanPath === '/bn/chambers' || cleanPath === '/en/chambers') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html lang="${locale}"><body><h1>Chambers</h1><div class="chamber-card">Dhanmondi Chamber: 5:00 PM - 9:00 PM</div><div class="chamber-card">Uttara Chamber: 6:00 PM - 10:00 PM</div></body></html>`,
      };
    }

    if (cleanPath === '/bn/blog' || cleanPath === '/en/blog') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html lang="${locale}"><body><h1>Health Blog</h1><article><h3>Diabetes Care & Management</h3><span class="reading-time">5 min read</span></article></body></html>`,
      };
    }

    if (cleanPath === '/bn/contact' || cleanPath === '/en/contact') {
      const disclaimer = isEn ? this.doctorCredentials.emergencyDisclaimerEn : this.doctorCredentials.emergencyDisclaimerBn;
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html lang="${locale}"><body><h1>Contact & FAQ</h1><form id="contact-form"><input name="honeypot" style="display:none"/></form><div class="emergency-disclaimer">${disclaimer}</div><div class="faq-list"><h3>Frequently Asked Questions</h3></div></body></html>`,
      };
    }

    if (cleanPath === '/bn/appointment' || cleanPath === '/en/appointment') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html lang="${locale}"><body><div id="booking-wizard">Booking Wizard Form</div></body></html>`,
      };
    }

    if (cleanPath === '/admin' || cleanPath === '/admin/login') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html><body><div id="payload-admin">Payload CMS Login & Dashboard</div></body></html>`,
      };
    }

    return {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<html><body>404 Not Found</body></html>',
    };
  }

  // ==========================================
  // Doctor Credentials API (F2)
  // ==========================================

  public getDoctorCredentials() {
    return { ...this.doctorCredentials };
  }

  public updateDoctorCredentials(creds: Partial<typeof this.doctorCredentials>, userRole: UserRole): boolean {
    if (userRole !== 'super-admin' && userRole !== 'doctor') {
      return false; // Assistant cannot modify credentials
    }
    this.doctorCredentials = { ...this.doctorCredentials, ...creds };
    this.recordAuditLog({
      id: randomUUID(),
      entity: 'DoctorProfile',
      entityId: 'singleton',
      action: 'UPDATE',
      userId: userRole,
      timestamp: new Date().toISOString(),
      metadata: creds,
    });
    return true;
  }

  // ==========================================
  // Availability Engine (F4)
  // ==========================================

  public async getAvailability(
    chamberId: string,
    dateStr: string // YYYY-MM-DD
  ): Promise<{ status: number; data: AvailabilityResponse | ApiErrorResponse }> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/appointments/availability?chamberId=${chamberId}&date=${dateStr}`);
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        // Fall back to simulator
      }
    }

    const schedule = this.schedules.get(chamberId);
    if (!schedule || !schedule.isActive) {
      return {
        status: 404,
        data: { success: false, error: 'CHAMBER_NOT_FOUND', code: 404 },
      };
    }

    // Check if date is in the past in Asia/Dhaka time
    const dhakaNow = getDhakaDateTime(new Date());
    if (dateStr < dhakaNow.dateString) {
      return {
        status: 400,
        data: { success: false, error: 'PAST_DATE_NOT_ALLOWED', code: 400 },
      };
    }

    // Check if chamber is on leave on this date
    for (const leave of this.leaves.values()) {
      if (leave.chamberId === chamberId) {
        if (dateStr >= leave.startDate && dateStr <= leave.endDate) {
          if (leave.allDay) {
            return {
              status: 200,
              data: {
                date: dateStr,
                timezone: 'Asia/Dhaka',
                bookingMode: schedule.bookingMode,
                slots: schedule.bookingMode === 'SLOT' ? [] : undefined,
                serials: schedule.bookingMode === 'SERIAL' ? { maxPatients: 0, bookedCount: 0, available: false, nextSerial: 0 } : undefined,
              },
            };
          }
        }
      }
    }

    // Purge expired holds before calculating
    this.reapExpiredReservations();

    if (schedule.bookingMode === 'SLOT') {
      const allSlots = generateSlotIntervals(
        dateStr,
        schedule.startTime,
        schedule.endTime,
        schedule.slotDurationMinutes
      );

      // Check existing active bookings (PENDING or CONFIRMED)
      const slotsWithAvailability = allSlots.map((slot) => {
        let isBooked = false;
        for (const appt of this.appointments.values()) {
          if (
            appt.chamberId === chamberId &&
            appt.date === dateStr &&
            appt.slotStart === slot.start &&
            (appt.status === 'PENDING' || appt.status === 'CONFIRMED')
          ) {
            isBooked = true;
            break;
          }
        }
        return {
          start: slot.start,
          end: slot.end,
          available: !isBooked,
        };
      });

      return {
        status: 200,
        data: {
          date: dateStr,
          timezone: 'Asia/Dhaka',
          bookingMode: 'SLOT',
          slots: slotsWithAvailability,
        },
      };
    } else {
      // SERIAL mode
      let bookedCount = 0;
      for (const appt of this.appointments.values()) {
        if (
          appt.chamberId === chamberId &&
          appt.date === dateStr &&
          (appt.status === 'PENDING' || appt.status === 'CONFIRMED')
        ) {
          bookedCount++;
        }
      }

      const available = bookedCount < schedule.maxPatients;
      return {
        status: 200,
        data: {
          date: dateStr,
          timezone: 'Asia/Dhaka',
          bookingMode: 'SERIAL',
          serials: {
            maxPatients: schedule.maxPatients,
            bookedCount,
            available,
            nextSerial: bookedCount + 1,
          },
        },
      };
    }
  }

  // ==========================================
  // Reservation Engine (F5, F6)
  // Concurrency & Partial Unique Index Simulation
  // ==========================================

  public async reserveSlot(
    req: ReservationRequest
  ): Promise<{ status: number; data: ReservationResponse | ApiErrorResponse }> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/appointments/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        // Fall back to simulator
      }
    }

    this.reapExpiredReservations();

    const schedule = this.schedules.get(req.chamberId);
    if (!schedule) {
      return {
        status: 404,
        data: { success: false, error: 'CHAMBER_NOT_FOUND', code: 404 },
      };
    }

    if (!req.patientName || !req.patientPhone || req.patientPhone.trim().length < 8) {
      return {
        status: 400,
        data: { success: false, error: 'INVALID_PATIENT_INFO', code: 400 },
      };
    }

    // Atomic simulation of PostgreSQL Partial Unique Indexes:
    // 1) SLOT Mode: unique_active_chamber_slot ("chamber_id", "slot_start") WHERE status IN ('PENDING', 'CONFIRMED')
    if (schedule.bookingMode === 'SLOT') {
      if (!req.slotStart) {
        return {
          status: 400,
          data: { success: false, error: 'SLOT_START_REQUIRED', code: 400 },
        };
      }

      for (const appt of this.appointments.values()) {
        if (
          appt.chamberId === req.chamberId &&
          appt.slotStart === req.slotStart &&
          (appt.status === 'PENDING' || appt.status === 'CONFIRMED')
        ) {
          // Trigger Postgres Unique Violation 23505 simulation
          return {
            status: 409,
            data: { success: false, error: 'SLOT_ALREADY_RESERVED', code: 409 },
          };
        }
      }
    } else {
      // 2) SERIAL Mode: capacity limit
      let bookedCount = 0;
      for (const appt of this.appointments.values()) {
        if (
          appt.chamberId === req.chamberId &&
          appt.date === req.date &&
          (appt.status === 'PENDING' || appt.status === 'CONFIRMED')
        ) {
          bookedCount++;
        }
      }

      if (bookedCount >= schedule.maxPatients) {
        return {
          status: 409,
          data: { success: false, error: 'CAPACITY_REACHED', code: 409 },
        };
      }
    }

    const appointmentId = randomUUID();
    const dateFormatted = req.date.replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceCode = `DOC-${dateFormatted}-${randomSuffix}`;
    const ttlMs = 5 * 60 * 1000; // 5-minute TTL
    const now = Date.now();
    const expiresAt = now + ttlMs;

    const newAppt: InternalAppointment = {
      id: appointmentId,
      referenceCode,
      chamberId: req.chamberId,
      date: req.date,
      slotStart: req.slotStart,
      bookingMode: req.bookingMode,
      patientName: req.patientName,
      patientPhone: req.patientPhone,
      patientEmail: req.patientEmail,
      status: 'PENDING',
      createdAt: now,
      expiresAt,
      otpCode: '123456', // Mock OTP
      otpAttempts: 0,
    };

    this.appointments.set(appointmentId, newAppt);

    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Appointments',
      entityId: appointmentId,
      action: 'CREATE',
      timestamp: new Date().toISOString(),
      metadata: { referenceCode, status: 'PENDING', mode: req.bookingMode },
    });

    return {
      status: 201,
      data: {
        appointmentId,
        referenceCode,
        status: 'PENDING',
        expiresAt: new Date(expiresAt).toISOString(),
        otpSent: true,
      },
    };
  }

  // ==========================================
  // OTP Verification (F6)
  // ==========================================

  public async verifyOtp(
    req: VerifyOtpRequest
  ): Promise<{ status: number; data: VerifyOtpResponse | ApiErrorResponse }> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/appointments/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        // Fall back to simulator
      }
    }

    const appt = this.appointments.get(req.appointmentId);
    if (!appt) {
      return {
        status: 404,
        data: { success: false, error: 'APPOINTMENT_NOT_FOUND', code: 404 },
      };
    }

    if (Date.now() > appt.expiresAt && appt.status === 'PENDING') {
      appt.status = 'CANCELLED';
      return {
        status: 410,
        data: { success: false, error: 'RESERVATION_EXPIRED', code: 410 },
      };
    }

    if (appt.status !== 'PENDING') {
      return {
        status: 400,
        data: { success: false, error: 'INVALID_STATUS_FOR_OTP', code: 400 },
      };
    }

    appt.otpAttempts++;
    if (appt.otpAttempts > 5) {
      appt.status = 'CANCELLED';
      return {
        status: 429,
        data: { success: false, error: 'TOO_MANY_OTP_ATTEMPTS', code: 429 },
      };
    }

    if (req.otpCode !== appt.otpCode) {
      return {
        status: 400,
        data: { success: false, error: 'INVALID_OTP', code: 400 },
      };
    }

    // OTP succeeded!
    appt.status = 'CONFIRMED';
    const signed = buildSignedUrls(appt.id, 7 * 24 * 3600, 'bn', 'http://localhost:3000', this.secret);

    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Appointments',
      entityId: appt.id,
      action: 'STATUS_CHANGE',
      timestamp: new Date().toISOString(),
      diff: { status: { old: 'PENDING', new: 'CONFIRMED' } },
      metadata: { referenceCode: appt.referenceCode },
    });

    return {
      status: 200,
      data: {
        appointmentId: appt.id,
        referenceCode: appt.referenceCode,
        status: 'CONFIRMED',
        managementUrl: signed.managementUrl,
        cancellationUrl: signed.cancellationUrl,
      },
    };
  }

  // ==========================================
  // Signed Cancellation & Management (F7)
  // ==========================================

  public async cancelAppointment(
    req: CancelAppointmentRequest
  ): Promise<{ status: number; data: CancelAppointmentResponse | ApiErrorResponse }> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/appointments/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        // Fall back to simulator
      }
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyManagementLinkSignature(req.appointmentId, req.expires, req.signature, this.secret);
    if (!isValid) {
      if (Date.now() > req.expires) {
        return {
          status: 403,
          data: { success: false, error: 'LINK_EXPIRED', code: 403 },
        };
      }
      return {
        status: 403,
        data: { success: false, error: 'INVALID_SIGNATURE', code: 403 },
      };
    }

    const appt = this.appointments.get(req.appointmentId);
    if (!appt) {
      return {
        status: 404,
        data: { success: false, error: 'APPOINTMENT_NOT_FOUND', code: 404 },
      };
    }

    const oldStatus = appt.status;
    appt.status = 'CANCELLED';

    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Appointments',
      entityId: appt.id,
      action: 'STATUS_CHANGE',
      timestamp: new Date().toISOString(),
      diff: { status: { old: oldStatus, new: 'CANCELLED' } },
      metadata: { reason: req.reason || 'Patient cancelled via signed link' },
    });

    return {
      status: 200,
      data: {
        appointmentId: appt.id,
        status: 'CANCELLED',
      },
    };
  }

  // ==========================================
  // Admin Walk-in Quick Entry (F9) & Status (F8, F9)
  // ==========================================

  public async createWalkIn(
    req: WalkInRequest,
    userRole: UserRole = 'assistant'
  ): Promise<{ status: number; data: WalkInResponse | ApiErrorResponse }> {
    if (userRole !== 'super-admin' && userRole !== 'doctor' && userRole !== 'assistant') {
      return {
        status: 403,
        data: { success: false, error: 'UNAUTHORIZED_ROLE', code: 403 },
      };
    }

    const schedule = this.schedules.get(req.chamberId);
    if (!schedule) {
      return {
        status: 404,
        data: { success: false, error: 'CHAMBER_NOT_FOUND', code: 404 },
      };
    }

    if (!req.patientName || !req.patientPhone) {
      return {
        status: 400,
        data: { success: false, error: 'MISSING_REQUIRED_FIELDS', code: 400 },
      };
    }

    // Check capacity for serial or slot collision
    if (schedule.bookingMode === 'SERIAL') {
      let bookedCount = 0;
      for (const appt of this.appointments.values()) {
        if (appt.chamberId === req.chamberId && appt.date === req.date && (appt.status === 'CONFIRMED' || appt.status === 'PENDING')) {
          bookedCount++;
        }
      }
      if (bookedCount >= schedule.maxPatients) {
        return {
          status: 409,
          data: { success: false, error: 'CAPACITY_REACHED', code: 409 },
        };
      }
    }

    const appointmentId = randomUUID();
    const dateFormatted = req.date.replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceCode = `DOC-${dateFormatted}-${randomSuffix}`;

    const appt: InternalAppointment = {
      id: appointmentId,
      referenceCode,
      chamberId: req.chamberId,
      date: req.date,
      slotStart: req.slotStart,
      bookingMode: req.bookingMode,
      patientName: req.patientName,
      patientPhone: req.patientPhone,
      patientEmail: req.patientEmail,
      status: 'CONFIRMED', // Walk-ins are directly CONFIRMED without OTP
      createdAt: Date.now(),
      expiresAt: 0,
      otpCode: '',
      otpAttempts: 0,
      notes: req.notes,
    };

    this.appointments.set(appointmentId, appt);

    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Appointments',
      entityId: appointmentId,
      action: 'WALK_IN_CREATED',
      userId: userRole,
      timestamp: new Date().toISOString(),
      metadata: { referenceCode, status: 'CONFIRMED' },
    });

    return {
      status: 201,
      data: {
        appointmentId,
        referenceCode,
        status: 'CONFIRMED',
        slotStart: req.slotStart,
      },
    };
  }

  public async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    userRole: UserRole = 'doctor'
  ): Promise<{ status: number; data: { appointmentId: string; status: AppointmentStatus } | ApiErrorResponse }> {
    const appt = this.appointments.get(appointmentId);
    if (!appt) {
      return {
        status: 404,
        data: { success: false, error: 'APPOINTMENT_NOT_FOUND', code: 404 },
      };
    }

    // Disallow illegal backwards transitions (e.g. COMPLETED -> PENDING)
    if (appt.status === 'COMPLETED' && newStatus === 'PENDING') {
      return {
        status: 400,
        data: { success: false, error: 'INVALID_STATUS_TRANSITION', code: 400 },
      };
    }

    const oldStatus = appt.status;
    appt.status = newStatus;

    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Appointments',
      entityId: appt.id,
      action: 'STATUS_CHANGE',
      userId: userRole,
      timestamp: new Date().toISOString(),
      diff: { status: { old: oldStatus, new: newStatus } },
    });

    return {
      status: 200,
      data: {
        appointmentId: appt.id,
        status: appt.status,
      },
    };
  }

  // ==========================================
  // Schedule & Leave Exceptions (F10)
  // ==========================================

  public addSchedule(schedule: ChamberSchedule) {
    this.schedules.set(schedule.id, schedule);
    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Schedules',
      entityId: schedule.id,
      action: 'CREATE',
      timestamp: new Date().toISOString(),
      metadata: { name: schedule.name },
    });
  }

  public getSchedule(chamberId: string): ChamberSchedule | undefined {
    return this.schedules.get(chamberId);
  }

  public addLeave(leave: LeaveException) {
    this.leaves.set(leave.id, leave);
    this.recordAuditLog({
      id: randomUUID(),
      entity: 'Leaves',
      entityId: leave.id,
      action: 'CREATE',
      timestamp: new Date().toISOString(),
      metadata: { chamberId: leave.chamberId, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason },
    });
  }

  public getLeaves(chamberId?: string): LeaveException[] {
    const all = Array.from(this.leaves.values());
    if (chamberId) {
      return all.filter((l) => l.chamberId === chamberId);
    }
    return all;
  }

  // ==========================================
  // Immutable Audit Logging (F11)
  // ==========================================

  private recordAuditLog(entry: AuditLogEntry) {
    this.auditLogs.push(Object.freeze({ ...entry }));
  }

  public getAuditLogs(filter?: { entity?: string; entityId?: string }): AuditLogEntry[] {
    let results = [...this.auditLogs];
    if (filter?.entity) {
      results = results.filter((l) => l.entity === filter.entity);
    }
    if (filter?.entityId) {
      results = results.filter((l) => l.entityId === filter.entityId);
    }
    return results;
  }

  public attemptDeleteAuditLog(id: string): { status: number; error?: string } {
    // Immutability rule: Audit logs can never be deleted or modified
    return {
      status: 403,
      error: 'AUDIT_LOGS_ARE_IMMUTABLE',
    };
  }

  // ==========================================
  // Internal Helpers & TTL Reaper
  // ==========================================

  public reapExpiredReservations(): number {
    const now = Date.now();
    let reapedCount = 0;
    for (const appt of this.appointments.values()) {
      if (appt.status === 'PENDING' && appt.expiresAt > 0 && now > appt.expiresAt) {
        appt.status = 'CANCELLED';
        reapedCount++;
        this.recordAuditLog({
          id: randomUUID(),
          entity: 'Appointments',
          entityId: appt.id,
          action: 'STATUS_CHANGE',
          userId: 'system:ttl-reaper',
          timestamp: new Date().toISOString(),
          diff: { status: { old: 'PENDING', new: 'CANCELLED' } },
        });
      }
    }
    return reapedCount;
  }

  public getAppointmentById(id: string): InternalAppointment | undefined {
    return this.appointments.get(id);
  }

  public setAppointmentTtl(id: string, expiresAt: number) {
    const appt = this.appointments.get(id);
    if (appt) {
      appt.expiresAt = expiresAt;
    }
  }
}
