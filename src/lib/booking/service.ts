// src/lib/booking/service.ts
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';

export type BookingMode = 'SLOT' | 'SERIAL';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface SerialInfo {
  maxPatients: number;
  bookedCount: number;
  available: boolean;
  nextSerial: number;
}

export interface AvailabilityResponse {
  date: string;
  timezone: 'Asia/Dhaka';
  bookingMode: BookingMode;
  slots?: TimeSlot[];
  serials?: SerialInfo;
}

export interface ReservationRequest {
  chamberId: string;
  slotStart?: string;
  date: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  bookingMode: BookingMode;
}

export interface ReservationResponse {
  appointmentId: string;
  referenceCode: string;
  status: 'PENDING';
  expiresAt: string;
  otpSent: boolean;
}

export interface VerifyOtpRequest {
  appointmentId: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  appointmentId: string;
  referenceCode: string;
  status: 'CONFIRMED';
  managementUrl: string;
  cancellationUrl: string;
}

export interface CancelAppointmentRequest {
  appointmentId: string;
  signature: string;
  expires: number;
  reason?: string;
}

export interface CancelAppointmentResponse {
  appointmentId: string;
  status: 'CANCELLED';
}

export interface WalkInRequest {
  chamberId: string;
  date: string;
  slotStart?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  bookingMode: BookingMode;
}

export interface WalkInResponse {
  appointmentId: string;
  referenceCode: string;
  status: 'CONFIRMED';
  slotStart?: string;
}

export interface ChamberSchedule {
  id: string;
  name: string;
  address: string;
  city: string;
  bookingMode: BookingMode;
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatients: number;
  isActive: boolean;
}

interface AppointmentRecord {
  id: string;
  referenceCode: string;
  chamberId: string;
  date: string;
  slotStart?: string;
  slotEnd?: string;
  serialNumber?: number;
  bookingMode: BookingMode;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  status: AppointmentStatus;
  createdAt: number;
  expiresAt: number;
  otpCode: string;
  otpAttempts: number;
  notes?: string;
}

const DEFAULT_SECRET = process.env.PAYLOAD_SECRET || 'TEMPORARY_FALLBACK_SECRET_MIN_32_CHARS_LONG_12345';

function signLink(appointmentId: string, expires: number): string {
  const payload = `${appointmentId}:${expires}`;
  return createHmac('sha256', DEFAULT_SECRET).update(payload).digest('hex');
}

export function verifySignature(appointmentId: string, expires: number, signature: string): boolean {
  if (Date.now() > expires) return false;
  const expected = signLink(appointmentId, expires);
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function buildUrls(appointmentId: string, ttlSeconds = 7 * 24 * 3600) {
  const expires = Date.now() + ttlSeconds * 1000;
  const signature = signLink(appointmentId, expires);
  const base = 'http://localhost:3000/bn/appointment/manage';
  return {
    expires,
    signature,
    managementUrl: `${base}?id=${encodeURIComponent(appointmentId)}&sig=${signature}&expires=${expires}`,
    cancellationUrl: `${base}?id=${encodeURIComponent(appointmentId)}&sig=${signature}&expires=${expires}&action=cancel`,
  };
}

function getDhakaDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

function generateSlots(startTime: string, endTime: string, slotMinutes: number, dateStr: string): Array<{ start: string; end: string }> {
  const [startH = 17, startM = 0] = startTime.split(':').map(Number);
  const [endH = 21, endM = 0] = endTime.split(':').map(Number);

  let currentMin = startH * 60 + startM;
  const endTotalMin = endH * 60 + endM;
  const slots: Array<{ start: string; end: string }> = [];

  while (currentMin + slotMinutes <= endTotalMin) {
    const sH = Math.floor(currentMin / 60);
    const sM = currentMin % 60;
    const eMin = currentMin + slotMinutes;
    const eH = Math.floor(eMin / 60);
    const eM = eMin % 60;

    const startIso = `${dateStr}T${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00+06:00`;
    const endIso = `${dateStr}T${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00+06:00`;

    slots.push({ start: startIso, end: endIso });
    currentMin += slotMinutes;
  }

  return slots;
}

const appointmentsStore = new Map<string, AppointmentRecord>();

const defaultChambers: Record<string, ChamberSchedule> = {
  'chamber-dhanmondi-1': {
    id: 'chamber-dhanmondi-1',
    name: 'Popular Diagnostic Centre, Dhanmondi',
    address: 'House #16, Road #2, Dhanmondi, Dhaka',
    city: 'Dhaka',
    bookingMode: 'SLOT',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '17:00',
    endTime: '21:00',
    slotDurationMinutes: 15,
    maxPatients: 16,
    isActive: true,
  },
  'chamber-uttara-2': {
    id: 'chamber-uttara-2',
    name: 'Labaid Diagnostic, Uttara',
    address: 'Sector 3, Uttara, Dhaka',
    city: 'Dhaka',
    bookingMode: 'SERIAL',
    weekdays: [5],
    startTime: '18:00',
    endTime: '22:00',
    slotDurationMinutes: 15,
    maxPatients: 25,
    isActive: true,
  },
};

export function getAvailability(chamberId: string, date: string): { status: number; data: AvailabilityResponse | { error: string } } {
  const chamber = defaultChambers[chamberId];
  if (!chamber) {
    return { status: 404, data: { error: 'CHAMBER_NOT_FOUND' } };
  }

  const today = getDhakaDateString();
  if (date < today) {
    return { status: 400, data: { error: 'PAST_DATE_NOT_ALLOWED' } };
  }

  if (chamber.bookingMode === 'SERIAL') {
    const activeSerials = Array.from(appointmentsStore.values()).filter(
      (a) => a.chamberId === chamberId && a.date === date && (a.status === 'PENDING' || a.status === 'CONFIRMED')
    );
    const bookedCount = activeSerials.length;
    const available = bookedCount < chamber.maxPatients;
    return {
      status: 200,
      data: {
        date,
        timezone: 'Asia/Dhaka',
        bookingMode: 'SERIAL',
        serials: {
          maxPatients: chamber.maxPatients,
          bookedCount,
          available,
          nextSerial: bookedCount + 1,
        },
      },
    };
  }

  const rawSlots = generateSlots(chamber.startTime, chamber.endTime, chamber.slotDurationMinutes, date);
  const activeBookings = Array.from(appointmentsStore.values()).filter(
    (a) => a.chamberId === chamberId && a.date === date && (a.status === 'PENDING' || a.status === 'CONFIRMED')
  );

  const slots = rawSlots.map((s) => {
    const isBooked = activeBookings.some((a) => a.slotStart === s.start);
    return {
      start: s.start,
      end: s.end,
      available: !isBooked,
    };
  });

  return {
    status: 200,
    data: {
      date,
      timezone: 'Asia/Dhaka',
      bookingMode: 'SLOT',
      slots,
    },
  };
}

export function reserveSlot(req: ReservationRequest): { status: number; data: ReservationResponse | { error: string } } {
  const chamber = defaultChambers[req.chamberId];
  if (!chamber) {
    return { status: 404, data: { error: 'CHAMBER_NOT_FOUND' } };
  }

  if (!req.patientPhone || req.patientPhone.trim().length < 6) {
    return { status: 400, data: { error: 'INVALID_PHONE_NUMBER' } };
  }

  if (chamber.bookingMode === 'SLOT' && !req.slotStart) {
    return { status: 400, data: { error: 'MISSING_SLOT_START' } };
  }

  if (chamber.bookingMode === 'SLOT') {
    const conflict = Array.from(appointmentsStore.values()).some(
      (a) =>
        a.chamberId === req.chamberId &&
        a.date === req.date &&
        a.slotStart === req.slotStart &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
    );
    if (conflict) {
      return { status: 409, data: { error: 'SLOT_ALREADY_RESERVED' } };
    }
  } else {
    const count = Array.from(appointmentsStore.values()).filter(
      (a) => a.chamberId === req.chamberId && a.date === req.date && (a.status === 'PENDING' || a.status === 'CONFIRMED')
    ).length;
    if (count >= chamber.maxPatients) {
      return { status: 409, data: { error: 'CAPACITY_REACHED' } };
    }
  }

  const id = randomUUID();
  const dateCompact = req.date.replace(/-/g, '');
  const randChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const referenceCode = `DOC-${dateCompact}-${randChars}`;
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;

  const record: AppointmentRecord = {
    id,
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
    otpCode: '123456',
    otpAttempts: 0,
  };

  appointmentsStore.set(id, record);

  return {
    status: 201,
    data: {
      appointmentId: id,
      referenceCode,
      status: 'PENDING',
      expiresAt: new Date(expiresAt).toISOString(),
      otpSent: true,
    },
  };
}

export function verifyOtp(req: VerifyOtpRequest): { status: number; data: VerifyOtpResponse | { error: string } } {
  const appt = appointmentsStore.get(req.appointmentId);
  if (!appt) {
    return { status: 404, data: { error: 'APPOINTMENT_NOT_FOUND' } };
  }

  if (Date.now() > appt.expiresAt) {
    appt.status = 'CANCELLED';
    return { status: 410, data: { error: 'RESERVATION_EXPIRED' } };
  }

  if (req.otpCode !== appt.otpCode) {
    appt.otpAttempts += 1;
    return { status: 400, data: { error: 'INVALID_OTP' } };
  }

  appt.status = 'CONFIRMED';
  const urls = buildUrls(appt.id);

  return {
    status: 200,
    data: {
      appointmentId: appt.id,
      referenceCode: appt.referenceCode,
      status: 'CONFIRMED',
      managementUrl: urls.managementUrl,
      cancellationUrl: urls.cancellationUrl,
    },
  };
}

export function cancelAppointment(req: CancelAppointmentRequest): { status: number; data: CancelAppointmentResponse | { error: string } } {
  const isValid = verifySignature(req.appointmentId, req.expires, req.signature);
  if (!isValid) {
    return { status: 403, data: { error: 'INVALID_OR_EXPIRED_SIGNATURE' } };
  }

  const appt = appointmentsStore.get(req.appointmentId);
  if (!appt) {
    return { status: 404, data: { error: 'APPOINTMENT_NOT_FOUND' } };
  }

  appt.status = 'CANCELLED';
  return {
    status: 200,
    data: {
      appointmentId: appt.id,
      status: 'CANCELLED',
    },
  };
}

export function createWalkIn(req: WalkInRequest): { status: number; data: WalkInResponse | { error: string } } {
  const chamber = defaultChambers[req.chamberId];
  if (!chamber) {
    return { status: 404, data: { error: 'CHAMBER_NOT_FOUND' } };
  }

  if (!req.patientPhone) {
    return { status: 400, data: { error: 'MISSING_REQUIRED_FIELDS' } };
  }

  const id = randomUUID();
  const dateCompact = req.date.replace(/-/g, '');
  const randChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const referenceCode = `DOC-${dateCompact}-${randChars}`;

  const record: AppointmentRecord = {
    id,
    referenceCode,
    chamberId: req.chamberId,
    date: req.date,
    slotStart: req.slotStart,
    bookingMode: req.bookingMode,
    patientName: req.patientName,
    patientPhone: req.patientPhone,
    status: 'CONFIRMED',
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
    otpCode: '',
    otpAttempts: 0,
    notes: req.notes,
  };

  appointmentsStore.set(id, record);

  return {
    status: 201,
    data: {
      appointmentId: id,
      referenceCode,
      status: 'CONFIRMED',
      slotStart: req.slotStart,
    },
  };
}
