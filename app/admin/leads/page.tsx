import type { Metadata } from "next";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth";
import { PageShell, Card } from "@/components/panel/page-shell";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Interesados" };

type Lead = {
  id: string;
  name: string;
  business_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  business_type: string | null;
  message: string | null;
  created_at: string;
};

export default async function LeadsPage() {
  await requirePlatformAdmin();
  const { data } = await getAdminSupabase().from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  const leads = (data ?? []) as Lead[];

  return (
    <PageShell title="Interesados" description="Personas que dejaron sus datos en la página de Klisto." wide>
      {leads.length === 0 ? (
        <p className="text-muted">Aún no hay interesados.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leads.map((l) => (
            <li key={l.id}>
              <Card>
                <p className="font-display text-lg font-bold">{l.business_name}</p>
                <p className="text-ink-soft">
                  {l.name} · {[l.business_type, l.city].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
                  <a className="font-semibold underline" href={`https://wa.me/57${l.phone}`} target="_blank" rel="noreferrer">
                    WhatsApp {formatPhone(l.phone)}
                  </a>
                  {l.email && (
                    <a className="underline" href={`mailto:${l.email}`}>
                      {l.email}
                    </a>
                  )}
                </p>
                {l.message && <p className="mt-2 text-sm text-ink-soft">“{l.message}”</p>}
                <p className="mt-2 text-xs text-muted">
                  {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(l.created_at))}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
