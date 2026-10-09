import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/orders/status";
import type { Business, Member } from "@/lib/types";

export type PanelSession = {
  userId: string;
  email: string | null;
  member: Member;
  business: Business;
};

/** Página de inicio según el rol. */
export function homeForRole(role: MemberRole): string {
  return role === "owner" ? "/panel" : role === "chef" ? "/panel/cocina" : "/panel/pedidos";
}

/** Usuario verificado con el servidor de Auth (no solo la cookie). */
export const getCurrentUser = cache(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getPanelSession = cache(async (): Promise<PanelSession | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await getServerSupabase();

  const { data: member } = await supabase
    .from("business_members")
    .select("id, business_id, user_id, role, display_name, username, is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || !member.is_active) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, name, business_type, logo_url, primary_color, phone, address, opening_hours, timezone, accepting_orders, plan, subscription_status, trial_ends_at, created_at",
    )
    .eq("id", member.business_id)
    .maybeSingle();
  if (!business) return null;

  return { userId: user.id, email: user.email ?? null, member: member as Member, business: business as Business };
});

/** Exige sesión del panel y, opcionalmente, uno de los roles indicados. */
export async function requirePanel(roles?: MemberRole[]): Promise<PanelSession> {
  const session = await getPanelSession();
  if (!session) {
    if (await isPlatformAdmin()) redirect("/admin");
    redirect("/panel/login");
  }
  if (roles && !roles.includes(session.member.role)) redirect(homeForRole(session.member.role));
  return session;
}

export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
});

export async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login?next=/admin");
  if (!(await isPlatformAdmin())) redirect("/panel");
  return user;
}
