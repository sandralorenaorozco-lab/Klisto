/** $12.500 — pesos colombianos, sin decimales, punto como separador de miles. */
export function formatCOP(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}$${grouped}`;
}

/** 3001234521 → "300 123 4521" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length !== 10) return phone;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Celular colombiano en formato internacional para WhatsApp: 573001234521 */
export function toWhatsAppNumber(phone: string): string {
  return `57${phone.replace(/\D/g, "").slice(-10)}`;
}

const TZ = "America/Bogota";

export function formatTime(iso: string, timeZone = TZ): string {
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function formatDate(isoOrDate: string, timeZone = TZ): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? new Date(`${isoOrDate}T12:00:00Z`) : new Date(isoOrDate);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? "UTC" : timeZone,
  }).format(date);
}

/** "hace 7 min", "hace 1 h 5 min" */
export function formatElapsed(fromIso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `hace ${h} h ${m} min` : `hace ${h} h`;
}

/** Fecha local (YYYY-MM-DD) en la zona horaria dada. */
export function localDateString(date: Date = new Date(), timeZone = TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
