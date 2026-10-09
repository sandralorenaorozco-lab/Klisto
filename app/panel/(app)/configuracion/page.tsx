import type { Metadata } from "next";
import { requirePanel } from "@/lib/auth";
import { PageShell, Card } from "@/components/panel/page-shell";
import { SettingsForm } from "@/components/panel/settings-form";
import { PLAN_LABELS } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Configuración" };

const STATUS: Record<string, string> = { trial: "En prueba", active: "Activa", suspended: "Suspendida" };

export default async function SettingsPage() {
  const { business } = await requirePanel(["owner"]);
  return (
    <PageShell title="Configuración" description="Así se ve tu negocio en tu página de pedidos.">
      <div className="space-y-6">
        <Card>
          <SettingsForm business={business} />
        </Card>
        <Card>
          <h2 className="font-display text-xl font-bold">Tu suscripción</h2>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            Plan <Badge tone="dark">{PLAN_LABELS[business.plan]}</Badge> · Estado{" "}
            <Badge tone={business.subscription_status === "suspended" ? "danger" : business.subscription_status === "active" ? "ready" : "brand"}>
              {STATUS[business.subscription_status]}
            </Badge>
          </p>
          {business.subscription_status === "trial" && business.trial_ends_at && (
            <p className="mt-2 text-sm text-muted">
              Tu prueba termina el{" "}
              {new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: business.timezone }).format(new Date(business.trial_ends_at))}.
            </p>
          )}
          <p className="mt-2 text-sm text-muted">Para cambiar de plan escríbenos a soporte de Klisto.</p>
        </Card>
      </div>
    </PageShell>
  );
}
