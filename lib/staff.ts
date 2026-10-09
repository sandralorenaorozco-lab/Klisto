/**
 * Meseros y chefs entran con "código del negocio + usuario + número de documento".
 * Supabase Auth necesita un correo, así que se genera uno interno que nunca
 * recibe mensajes.
 */
export const STAFF_EMAIL_DOMAIN = "staff.klisto.co";

export function staffEmail(businessSlug: string, username: string): string {
  return `${username.trim().toLowerCase()}.${businessSlug.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}
