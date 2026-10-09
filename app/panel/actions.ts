"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";
import { staffEmail } from "@/lib/staff";
import type { MemberRole } from "@/lib/orders/status";

export type LoginState = { error?: string };

const GENERIC_ERROR = "Los datos de acceso no coinciden. Revisa e intenta de nuevo.";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const mode = formData.get("mode") === "staff" ? "staff" : "owner";
  const password = String(formData.get("password") ?? "");
  let email: string;

  if (mode === "staff") {
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    if (!slug || !username || !password) return { error: "Completa el código del negocio, tu usuario y tu número de documento." };
    email = staffEmail(slug, username);
  } else {
    email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: GENERIC_ERROR };

  const { data: admin } = await supabase.from("platform_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();

  const { data: member } = await supabase
    .from("business_members")
    .select("role, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (member && !member.is_active) {
    await supabase.auth.signOut();
    return { error: "Tu usuario está desactivado. Habla con el dueño del negocio." };
  }

  const next = String(formData.get("next") ?? "");
  if (admin && (!member || next.startsWith("/admin"))) redirect("/admin");
  if (!member) {
    await supabase.auth.signOut();
    return { error: "Tu usuario no está asociado a ningún negocio." };
  }

  const home = homeForRole(member.role as MemberRole);
  redirect(next.startsWith("/panel/") && member.role === "owner" ? next : home);
}

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/panel/login");
}
