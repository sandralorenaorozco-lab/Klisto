import type { DayKey, OpeningHours } from "@/lib/types";

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function localParts(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAY_TO_KEY[get("weekday")], minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/**
 * ¿Está abierto ahora? Si el negocio no configuró horario, se considera abierto.
 * Soporta horarios que pasan la medianoche (p. ej. 18:00 a 02:00).
 */
export function isOpenNow(hours: OpeningHours | null | undefined, timeZone = "America/Bogota", now = new Date()): boolean {
  if (!hours || Object.keys(hours).length === 0) return true;
  const { day, minutes } = localParts(now, timeZone);
  const prevDay = DAY_KEYS[(DAY_KEYS.indexOf(day) + 6) % 7];

  const today = hours[day];
  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  // Horario de ayer que se extiende después de medianoche.
  const yesterday = hours[prevDay];
  if (yesterday && !yesterday.closed) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}

export function todayHoursLabel(hours: OpeningHours | null | undefined, timeZone = "America/Bogota", now = new Date()): string | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const { day } = localParts(now, timeZone);
  const today = hours[day];
  if (!today || today.closed) return "Hoy cerrado";
  return `Hoy de ${today.open} a ${today.close}`;
}
