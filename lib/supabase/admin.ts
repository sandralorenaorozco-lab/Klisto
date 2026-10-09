import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, SUPABASE_URL } from "@/lib/env";

/**
 * Cliente con la clave secreta: SALTA RLS. Úsalo solo en el servidor y
 * siempre después de verificar permisos (crear pedidos, crear personal,
 * superadministrador, registro de notificaciones).
 */
export function getAdminSupabase() {
  return createClient(SUPABASE_URL, getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
