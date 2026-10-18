/**
 * Asia/Dhaka (+06:00 UTC) Calendar & Timezone calculation helpers.
 * Authoritative timezone specified in ORIGINAL_REQUEST.md (R3) and PROJECT.md (§ Architecture).
 */

export const DHAKA_OFFSET_HOURS = 6;
export const DHAKA_OFFSET_MS = DHAKA_OFFSET_HOURS * 60 * 60 * 1000;

export interface DhakaDateTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  dateString: string; // YYYY-MM-DD
  timeString: string; // HH:MM
  weekday: number; // 0=Sunday .. 6=Saturday
  epochMs: number;
}

export function getDhakaDateTime(date: Date = new Date()): DhakaDateTime {
  // Use Intl to get accurate parts in Asia/Dhaka timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hours = parseInt(partMap.hour, 10);
  if (hours === 24) hours = 0; // standard formatting fix
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);

  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[partMap.weekday] ?? 0;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dateString,
    timeString,
    weekday,
    epochMs: date.getTime(),
  };
}

export function parseDhakaSlot(dateStr: string, timeStr: string): Date {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  // Asia/Dhaka is +06:00
  const isoString = `${dateStr}T${timeStr}:00+06:00`;
  return new Date(isoString);
}

export function generateSlotIntervals(
  dateStr: string,
  startTimeStr: string, // "17:00"
  endTimeStr: string, // "21:00"
  slotDurationMinutes: number // 15
): Array<{ start: string; end: string }> {
  if (slotDurationMinutes <= 0) return [];

  const [startH, startM] = startTimeStr.split(':').map((s) => parseInt(s, 10));
  const [endH, endM] = endTimeStr.split(':').map((s) => parseInt(s, 10));

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  if (startTotalMinutes >= endTotalMinutes) return [];

  const slots: Array<{ start: string; end: string }> = [];

  let current = startTotalMinutes;
  while (current + slotDurationMinutes <= endTotalMinutes) {
    const slotStartH = Math.floor(current / 60);
    const slotStartM = current % 60;
    const next = current + slotDurationMinutes;
    const slotEndH = Math.floor(next / 60);
    const slotEndM = next % 60;

    const startHStr = String(slotStartH).padStart(2, '0');
    const startMStr = String(slotStartM).padStart(2, '0');
    const endHStr = String(slotEndH).padStart(2, '0');
    const endMStr = String(slotEndM).padStart(2, '0');

    const startIso = `${dateStr}T${startHStr}:${startMStr}:00+06:00`;
    const endIso = `${dateStr}T${endHStr}:${endMStr}:00+06:00`;

    slots.push({
      start: startIso,
      end: endIso,
    });

    current = next;
  }

  return slots;
}
