"use server";

import { revalidatePath } from "next/cache";
import { fail, getFile, ownerContext, uploadBusinessImage, type ActionState } from "@/lib/panel";
import { isHexColor } from "@/lib/color";
import { DAY_KEYS } from "@/lib/hours";
import { normalizeColombianMobile } from "@/lib/validation";
import type { OpeningHours } from "@/lib/types";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { session, supabase } = await ownerContext();
    const errors: Record<string, string> = {};

    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2 || name.length > 80) errors.name = "El nombre debe tener entre 2 y 80 caracteres.";

    const color = String(formData.get("primary_color") ?? "").trim();
    if (!isHexColor(color)) errors.primary_color = "Elige un color válido.";

    const phoneRaw = String(formData.get("phone") ?? "").trim();
    const phone = phoneRaw ? normalizeColombianMobile(phoneRaw) : null;
    if (phone && !/^3\d{9}$/.test(phone)) errors.phone = "Celular de 10 dígitos que empiece por 3.";

    const hours: OpeningHours = {};
    for (const day of DAY_KEYS) {
      const closed = formData.get(`${day}_closed`) === "on";
      const open = String(formData.get(`${day}_open`) ?? "");
      const close = String(formData.get(`${day}_close`) ?? "");
      if (closed) {
        hours[day] = { open: open || "00:00", close: close || "00:00", closed: true };
      } else if (open || close) {
        if (!TIME.test(open) || !TIME.test(close)) errors.hours = "Revisa los horarios: usa el formato HH:MM.";
        else hours[day] = { open, close };
      }
    }

    if (Object.keys(errors).length) return { ok: false, errors, message: "Revisa los campos marcados." };

    const values: Record<string, unknown> = {
      name,
      primary_color: color.toUpperCase(),
      phone,
      address: String(formData.get("address") ?? "").trim().slice(0, 160) || null,
      opening_hours: hours,
      accepting_orders: formData.get("accepting_orders") === "on",
    };
    const logo = getFile(formData, "logo");
    if (logo) values.logo_url = await uploadBusinessImage(session.business.id, "logo", logo);
    if (formData.get("remove_logo") === "on") values.logo_url = null;

    const { error } = await supabase.from("businesses").update(values).eq("id", session.business.id);
    if (error) throw error;

    revalidatePath("/panel", "layout");
    revalidatePath(`/${session.business.slug}`, "layout");
    return { ok: true, message: "Configuración guardada." };
  } catch (e) {
    return fail(e);
  }
}
