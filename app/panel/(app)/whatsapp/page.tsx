import type { Metadata } from "next";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { isWhatsAppLive } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { formatPhone } from "@/lib/format";
import { PageShell } from "@/components/panel/page-shell";

export const metadata: Metadata = { title: "Mensajes de WhatsApp" };

type LogRow = {
  id: number;
  template: string;
  to_phone: string;
  payload: { preview?: string };
  mode: "simulated" | "live";
  status: "sent" | "failed";
  error: string | null;
  created_at: string;
};

export default async function WhatsAppLogPage() {
  const { business } = await requirePanel(["owner"]);
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("notifications_log")
    .select("id, template, to_phone, payload, mode, status, error, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as LogRow[];
  const live = isWhatsAppLive();

  return (
    <PageShell title="Mensajes de WhatsApp" description="Confirmaciones y avisos de pedido listo enviados a tus clientes.">
      <Notice tone={live ? "success" : "info"}>
        {live
          ? "WhatsApp está conectado: los mensajes se envían de verdad con la API oficial de Meta."
          : "Modo simulado: los mensajes no se envían; se muestran aquí para que puedas probar todo el flujo."}
      </Notice>

      {rows.length === 0 ? (
        <p className="mt-6 text-muted">Todavía no hay mensajes.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-[0_1px_0_#D9DBE0]">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">+{r.to_phone.slice(0, 2)} {formatPhone(r.to_phone.slice(2))}</span>
                <Badge>{r.template === "pedido_listo" ? "Pedido listo" : "Pedido confirmado"}</Badge>
                <Badge tone={r.mode === "live" ? "dark" : "neutral"}>{r.mode === "live" ? "Real" : "Simulado"}</Badge>
                {r.status === "failed" && <Badge tone="danger">Falló</Badge>}
                <time className="ml-auto text-muted" dateTime={r.created_at}>
                  {new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short", timeZone: business.timezone }).format(new Date(r.created_at))}
                </time>
              </div>
              {r.payload?.preview && <p className="mt-2 text-ink-soft">{r.payload.preview}</p>}
              {r.error && <p className="mt-1 text-sm text-danger">{r.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
