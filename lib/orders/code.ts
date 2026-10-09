/**
 * Código del pedido: INICIALES-ÚLTIMOS4DÍGITOS-CONSECUTIVO
 * Ejemplo: "Sofía López Ortiz", 3001234521, quinto pedido del día → "SLO-4521-05".
 */

/** Quita tildes y diacríticos (Á→A, Ñ→N, Ü→U). */
export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Primeras letras de hasta 3 palabras del nombre, en mayúsculas y sin tildes. */
export function getInitials(fullName: string): string {
  const words = stripAccents(fullName)
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean)
    .slice(0, 3);

  if (words.length === 0) {
    throw new Error("El nombre debe tener al menos una letra");
  }
  return words.map((word) => word[0]).join("");
}

/** Últimos 4 dígitos del celular (acepta espacios, guiones o +57). */
export function getPhoneSuffix(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    throw new Error("El celular debe tener al menos 4 dígitos");
  }
  return digits.slice(-4);
}

/** Consecutivo con mínimo 2 dígitos: 5 → "05", 12 → "12", 100 → "100". */
export function formatDailyNumber(dailyNumber: number): string {
  if (!Number.isInteger(dailyNumber) || dailyNumber < 1) {
    throw new Error("El consecutivo debe ser un entero mayor que cero");
  }
  return String(dailyNumber).padStart(2, "0");
}

export function buildOrderCode(input: {
  customerName: string;
  phone: string;
  dailyNumber: number;
}): string {
  return [
    getInitials(input.customerName),
    getPhoneSuffix(input.phone),
    formatDailyNumber(input.dailyNumber),
  ].join("-");
}

/** Normaliza lo que escribe el cliente al consultar ("slo-4521-05 " → "SLO-4521-05"). */
export function normalizeOrderCode(code: string): string {
  return stripAccents(code).trim().toUpperCase().replace(/\s+/g, "");
}

export const ORDER_CODE_PATTERN = /^[A-Z]{1,3}-\d{4}-\d{2,}$/;
