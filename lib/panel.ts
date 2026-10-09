import "server-only";
import { getPanelSession, type PanelSession } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/env";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export class PanelError extends Error {}

/** Sesión del dueño para acciones del panel. Lanza PanelError si no corresponde. */
export async function ownerContext(): Promise<{ session: PanelSession; supabase: Awaited<ReturnType<typeof getServerSupabase>> }> {
  const session = await getPanelSession();
  if (!session) throw new PanelError("Tu sesión terminó. Vuelve a entrar.");
  if (session.member.role !== "owner") throw new PanelError("Solo el dueño o administrador puede hacer esto.");
  return { session, supabase: await getServerSupabase() };
}

export function fail(e: unknown, fallback = "No se pudo guardar. Intenta de nuevo."): ActionState {
  if (e instanceof PanelError) return { ok: false, message: e.message };
  console.error("[panel]", e);
  return { ok: false, message: fallback };
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Sube una imagen al bucket business-assets dentro de la carpeta del negocio.
 * Se usa la clave secreta después de verificar que quien sube es el dueño.
 */
export async function uploadBusinessImage(businessId: string, folder: string, file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new PanelError("La imagen debe ser JPG, PNG o WebP.");
  if (file.size > MAX_IMAGE_BYTES) throw new PanelError("La imagen debe pesar máximo 5 MB.");

  const path = `${businessId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await getAdminSupabase()
    .storage.from("business-assets")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/business-assets/${path}`;
}

export function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/** "12.500" o "$12500" → 12500 */
export function parsePesos(value: FormDataEntryValue | null): number | null {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) && n <= 100_000_000 ? n : null;
}
