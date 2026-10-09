import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import { PageShell, Card } from "@/components/panel/page-shell";
import { Badge } from "@/components/ui/badge";
import { CreateBusinessForm } from "@/components/admin/create-business-form";
import { PLAN_LABELS } from "@/lib/plans";
import { updateSubscription } from "./actions";
import type { Business } from "@/lib/types";

export const metadata: Metadata = { title: "Negocios" };

const STATUS = {
  trial: { label: "En prueba", tone: "brand" },
  active: { label: "Activa", tone: "ready" },
  suspended: { label: "Suspendida", tone: "danger" },
} as const;

export default async function AdminPage() {
  await requirePlatformAdmin();
  const db = getAdminSupabase();
  const [{ data }, { data: owners }] = await Promise.all([
    db.from("businesses").select("id, slug, name, business_type, plan, subscription_status, trial_ends_at, created_at").order("created_at", { ascending: false }),
    db.from("business_members").select("business_id, display_name").eq("role", "owner"),
  ]);
  const businesses = (data ?? []) as Business[];
  const ownerBy = new Map((owners ?? []).map((o) => [o.business_id, o.display_name as string]));
  const count = (s: string) => businesses.filter((b) => b.subscription_status === s).length;

  return (
    <PageShell title="Negocios" description="Suscripciones de todos los negocios en Klisto." wide>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Total", businesses.length],
            ["Activas", count("active")],
            ["En prueba", count("trial")],
            ["Suspendidas", count("suspended")],
          ].map(([label, n]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-[0_1px_0_#D9DBE0]">
              <p className="text-sm font-semibold text-muted">{label}</p>
              <p className="font-display text-3xl font-bold">{n}</p>
            </div>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Negocios suscritos</caption>
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 font-semibold">Negocio</th>
                  <th scope="col" className="py-2 font-semibold">Tipo</th>
                  <th scope="col" className="py-2 font-semibold">Estado</th>
                  <th scope="col" className="py-2 font-semibold">Plan y suscripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {businesses.map((b) => (
                  <tr key={b.id} className="align-middle">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-muted">
                        <Link href={`/${b.slug}`} target="_blank" className="underline">
                          /{b.slug}
                        </Link>
                        {ownerBy.get(b.id) && ` · ${ownerBy.get(b.id)}`}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{b.business_type === "restaurant" ? "Restaurante" : "Servicios"}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={STATUS[b.subscription_status].tone}>{STATUS[b.subscription_status].label}</Badge>
                      <p className="mt-1 text-xs text-muted">{PLAN_LABELS[b.plan]}</p>
                    </td>
                    <td className="py-3">
                      {/* key: React 19 reinicia el formulario tras enviarlo; así toma los valores nuevos. */}
                      <form key={`${b.plan}-${b.subscription_status}`} action={updateSubscription} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={b.id} />
                        <label className="sr-only" htmlFor={`plan-${b.id}`}>
                          Plan de {b.name}
                        </label>
                        <select id={`plan-${b.id}`} name="plan" defaultValue={b.plan} className="min-h-11 rounded-lg border-2 border-line bg-white px-2">
                          <option value="basico">Básico</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                        <label className="sr-only" htmlFor={`status-${b.id}`}>
                          Estado de la suscripción de {b.name}
                        </label>
                        <select
                          id={`status-${b.id}`}
                          name="subscription_status"
                          defaultValue={b.subscription_status}
                          className="min-h-11 rounded-lg border-2 border-line bg-white px-2"
                        >
                          <option value="trial">En prueba</option>
                          <option value="active">Activa</option>
                          <option value="suspended">Suspendida</option>
                        </select>
                        <button type="submit" className="min-h-11 rounded-lg bg-ink px-3 font-semibold text-white">
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">Crear negocio</h2>
          <p className="mt-1 text-sm text-muted">Crea el negocio y la cuenta de su dueño. Comparte con el dueño su correo y contraseña temporal.</p>
          <div className="mt-4">
            <CreateBusinessForm />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
