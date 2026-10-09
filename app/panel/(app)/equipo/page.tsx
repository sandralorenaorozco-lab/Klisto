import type { Metadata } from "next";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageShell, Card } from "@/components/panel/page-shell";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { StaffCreateForm, StaffPasswordForm } from "@/components/panel/staff-forms";
import { ROLE_LABELS, type MemberRole } from "@/lib/orders/status";
import { deleteStaff, setStaffActive } from "./actions";

export const metadata: Metadata = { title: "Equipo" };

export default async function TeamPage() {
  const { business, member: me } = await requirePanel(["owner"]);
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("business_members")
    .select("id, role, display_name, username, is_active, created_at")
    .eq("business_id", business.id)
    .order("created_at");
  const members = (data ?? []) as { id: string; role: MemberRole; display_name: string; username: string | null; is_active: boolean }[];

  return (
    <PageShell title="Equipo" description="Crea un usuario para cada mesero y chef. Cada persona entra con su usuario y su número de documento.">
      <div className="space-y-6">
        <Card>
          <h2 className="font-display text-xl font-bold">Agregar persona</h2>
          <div className="mt-4">
            <StaffCreateForm />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">Tu equipo</h2>
          <ul className="mt-3 divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{m.display_name}</p>
                  <Badge tone={m.role === "owner" ? "dark" : m.role === "chef" ? "brand" : "neutral"}>{ROLE_LABELS[m.role]}</Badge>
                  {!m.is_active && <Badge tone="danger">Desactivado</Badge>}
                  {m.username && <span className="text-sm text-muted">usuario: {m.username}</span>}
                  {m.id === me.id && <span className="text-sm text-muted">(tú)</span>}
                </div>
                {m.role !== "owner" && (
                  <div className="flex flex-wrap items-end gap-2">
                    <StaffPasswordForm memberId={m.id} name={m.display_name} />
                    <form action={setStaffActive}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value={String(!m.is_active)} />
                      <button type="submit" className="min-h-11 rounded-lg bg-mist px-3 text-sm font-semibold">
                        {m.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <form action={deleteStaff}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="min-h-11 rounded-lg px-3 text-sm font-semibold text-danger">
                        Eliminar
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Notice tone="info">
          Seguridad: el número de documento es fácil de adivinar para quien conoce a la persona. Desactiva de inmediato a quien deje de
          trabajar contigo. El chef solo ve la cocina y los pedidos; el mesero solo puede entregar o cancelar.
        </Notice>
      </div>
    </PageShell>
  );
}
