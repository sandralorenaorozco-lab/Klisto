"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getCurrentUser, isPlatformAdmin } from "@/lib/auth";
import { slugSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/panel";

async function assertAdmin() {
  if (!(await getCurrentUser()) || !(await isPlatformAdmin())) throw new Error("Solo para administradores de Klisto.");
}

const subscriptionSchema = z.object({
  id: z.uuid(),
  plan: z.enum(["basico", "pro", "premium"]),
  subscription_status: z.enum(["trial", "active", "suspended"]),
});

export async function updateSubscription(formData: FormData) {
  await assertAdmin();
  const data = subscriptionSchema.parse({
    id: formData.get("id"),
    plan: formData.get("plan"),
    subscription_status: formData.get("subscription_status"),
  });
  const { data: business, error } = await getAdminSupabase()
    .from("businesses")
    .update({ plan: data.plan, subscription_status: data.subscription_status })
    .eq("id", data.id)
    .select("slug")
    .single();
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath(`/${business.slug}`, "layout");
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del negocio.").max(80),
  slug: slugSchema,
  business_type: z.enum(["restaurant", "services"]),
  plan: z.enum(["basico", "pro", "premium"]),
  owner_name: z.string().trim().min(2, "Escribe el nombre del dueño.").max(80),
  owner_email: z.email("Correo no válido."),
  owner_password: z.string().min(8, "Mínimo 8 caracteres."),
});

export async function createBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertAdmin();
    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { ok: false, errors, message: "Revisa los campos marcados." };
    }
    const d = parsed.data;
    const db = getAdminSupabase();

    const { data: taken } = await db.from("businesses").select("id").eq("slug", d.slug).maybeSingle();
    if (taken) return { ok: false, errors: { slug: "Esa dirección ya está en uso." } };

    const { data: business, error: bizError } = await db
      .from("businesses")
      .insert({ name: d.name, slug: d.slug, business_type: d.business_type, plan: d.plan, subscription_status: "trial" })
      .select("id")
      .single();
    if (bizError) {
      return { ok: false, errors: { slug: "Dirección no permitida o en uso." }, message: bizError.message };
    }

    const { data: created, error: userError } = await db.auth.admin.createUser({
      email: d.owner_email.toLowerCase(),
      password: d.owner_password,
      email_confirm: true,
      user_metadata: { display_name: d.owner_name },
    });
    if (userError || !created.user) {
      await db.from("businesses").delete().eq("id", business.id);
      return { ok: false, errors: { owner_email: "Ya existe un usuario con ese correo." } };
    }

    const { error: memberError } = await db
      .from("business_members")
      .insert({ business_id: business.id, user_id: created.user.id, role: "owner", display_name: d.owner_name });
    if (memberError) {
      await db.auth.admin.deleteUser(created.user.id);
      await db.from("businesses").delete().eq("id", business.id);
      throw memberError;
    }

    revalidatePath("/admin");
    return { ok: true, message: `Negocio creado. El dueño entra en /panel/login con ${d.owner_email}.` };
  } catch (e) {
    console.error("[admin]", e);
    return { ok: false, message: "No se pudo crear el negocio." };
  }
}
