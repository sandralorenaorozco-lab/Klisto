"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { DATA_POLICY_VERSION, leadSchema } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/env";

export type LeadState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    city: formData.get("city") ?? "",
    businessType: formData.get("businessType") ?? "",
    message: formData.get("message") ?? "",
    dataConsent: formData.get("dataConsent") === "on",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      errors[key] ??= issue.message;
    }
    return { ok: false, errors, message: "Revisa los campos marcados." };
  }

  if (!isSupabaseConfigured()) {
    console.info("[Lead sin Supabase configurado]", parsed.data);
    return { ok: true, message: "¡Gracias! Te contactaremos muy pronto." };
  }

  const d = parsed.data;
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("leads").insert({
    name: d.name,
    business_name: d.businessName,
    phone: d.phone,
    email: d.email || null,
    city: d.city || null,
    business_type: d.businessType || null,
    message: d.message || null,
    data_consent_at: new Date().toISOString(),
    data_policy_version: DATA_POLICY_VERSION,
  });

  if (error) {
    console.error("[Lead] Error guardando:", error.message);
    return { ok: false, message: "No pudimos enviar tus datos. Intenta de nuevo en un momento." };
  }

  return { ok: true, message: "¡Gracias! Te escribiremos por WhatsApp en menos de un día hábil." };
}
