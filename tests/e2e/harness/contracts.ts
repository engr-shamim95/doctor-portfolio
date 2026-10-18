/**
 * Type contracts & schemas derived strictly from:
 * - ORIGINAL_REQUEST.md (R1 - R5)
 * - PROJECT.md (§ Interface Contracts & Feature Inventory)
 */

export type BookingMode = 'SLOT' | 'SERIAL';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type UserRole = 'super-admin' | 'doctor' | 'assistant';

export interface TimeSlot {
  start: string; // ISO 8601 string or HH:MM in Asia/Dhaka
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
  date: string; // YYYY-MM-DD
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
  referenceCode: string; // DOC-YYYYMMDD-XXXX
  status: 'PENDING';
  expiresAt: string; // ISO string 5 min TTL
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
  serialNumber?: number;
  slotStart?: string;
}

export interface ChamberSchedule {
  id: string;
  name: string;
  address: string;
  city: string;
  bookingMode: BookingMode;
  weekdays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "17:00"
  endTime: string; // "21:00"
  slotDurationMinutes: number; // e.g. 15
  maxPatients: number; // e.g. 16
  isActive: boolean;
}

export interface LeaveException {
  id: string;
  chamberId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface AuditLogEntry {
  id: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'WALK_IN_CREATED' | 'STATUS_CHANGE' | 'SECURITY_ALERT';
  userId?: string;
  timestamp: string;
  diff?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: number;
  details?: unknown;
}

export const REFERENCE_CODE_REGEX = /^DOC-\d{8}-[A-Z0-9]{4}$/;
export const DHAKA_TIMEZONE = 'Asia/Dhaka';
export const DEFAULT_PAYLOAD_SECRET = 'doctor-portfolio-test-secret-32-chars-long!';
