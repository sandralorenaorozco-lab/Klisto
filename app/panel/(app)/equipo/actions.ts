"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { fail, ownerContext, PanelError, type ActionState } from "@/lib/panel";
import { staffEmail } from "@/lib/staff";
import { documentNumberSchema, usernameSchema } from "@/lib/validation";

const staffSchema = z.object({
  display_name: z.string().trim().min(2, "Escribe el nombre.").max(80),
  username: usernameSchema,
  role: z.enum(["waiter", "chef"], { message: "Elige el rol." }),
  document: documentNumberSchema,
});

export async function createStaff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { session } = await ownerContext();
    const parsed = staffSchema.safeParse({
      display_name: formData.get("display_name"),
      username: formData.get("username"),
      role: formData.get("role"),
      document: String(formData.get("document") ?? "").replace(/[.\s]/g, ""),
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { ok: false, errors, message: "Revisa los campos marcados." };
    }
    const d = parsed.data;
    const admin = getAdminSupabase();

    const { data: existing } = await admin
      .from("business_members")
      .select("id")
      .eq("business_id", session.business.id)
      .eq("username", d.username)
      .maybeSingle();
    if (existing) return { ok: false, errors: { username: "Ya existe alguien con ese usuario en tu equipo." } };

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: staffEmail(session.business.slug, d.username),
      password: d.document,
      email_confirm: true,
      user_metadata: { display_name: d.display_name },
    });
    if (authError || !created.user) {
      console.error("[equipo] createUser:", authError?.message);
      return { ok: false, errors: { username: "Ese usuario no está disponible. Prueba con otro." } };
    }

    const { error } = await admin.from("business_members").insert({
      business_id: session.business.id,
      user_id: created.user.id,
      role: d.role,
      display_name: d.display_name,
      username: d.username,
    });
    if (error) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw error;
    }

    revalidatePath("/panel/equipo");
    return { ok: true, message: `Listo. ${d.display_name} entra con el negocio "${session.business.slug}", el usuario "${d.username}" y su número de documento.` };
  } catch (e) {
    return fail(e);
  }
}

/** Verifica que el miembro pertenezca al negocio del dueño y no sea el propio dueño. */
async function staffMember(memberId: string) {
  const { session } = await ownerContext();
  const admin = getAdminSupabase();
  const { data: member } = await admin
    .from("business_members")
    .select("id, user_id, role, business_id, is_active")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.business_id !== session.business.id || member.role === "owner") {
    throw new PanelError("No encontramos a esa persona en tu equipo.");
  }
  return { admin, member };
}

export async function setStaffActive(formData: FormData) {
  const { admin, member } = await staffMember(String(formData.get("id")));
  const active = formData.get("active") === "true";
  await admin.from("business_members").update({ is_active: active }).eq("id", member.id);
  // Bloquea también el inicio de sesión mientras esté desactivado.
  await admin.auth.admin.updateUserById(member.user_id, { ban_duration: active ? "none" : "876000h" });
  revalidatePath("/panel/equipo");
}

export async function resetStaffPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const document = documentNumberSchema.safeParse(String(formData.get("document") ?? "").replace(/[.\s]/g, ""));
    if (!document.success) return { ok: false, message: document.error.issues[0].message };
    const { admin, member } = await staffMember(String(formData.get("id")));
    const { error } = await admin.auth.admin.updateUserById(member.user_id, { password: document.data });
    if (error) throw error;
    return { ok: true, message: "Contraseña actualizada." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteStaff(formData: FormData) {
  const { admin, member } = await staffMember(String(formData.get("id")));
  await admin.auth.admin.deleteUser(member.user_id); // borra también la membresía (cascade)
  revalidatePath("/panel/equipo");
}
