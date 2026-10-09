import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageShell, Card } from "@/components/panel/page-shell";
import { AcceptingOrdersToggle } from "@/components/panel/accepting-toggle";
import { Notice } from "@/components/ui/notice";
import { formatCOP, localDateString } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import { SITE_URL } from "@/lib/env";
import { IconBag, IconChart, IconChef, IconQr, IconSettings, IconUsers } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Inicio" };

export default async function PanelHome() {
  const { business, member } = await requirePanel(["owner"]);
  const supabase = await getServerSupabase();
  const today = localDateString(new Date(), business.timezone);

  const [{ data: sales }, { count: active }, { count: products }] = await Promise.all([
    supabase.rpc("report_sales_by_day", { p_business_id: business.id, p_from: today, p_to: today }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("business_id", business.id).in("status", ACTIVE_STATUSES as string[]),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", business.id),
  ]);
  const todayRow = (sales as { orders_count: number; sales: number }[] | null)?.[0];
  const url = `${SITE_URL}/${business.slug}`;

  const links = [
    { href: "/panel/cocina", label: "Pantalla de cocina", icon: <IconChef /> },
    { href: "/panel/menu", label: "Editar menú", icon: <IconBag /> },
    { href: "/panel/equipo", label: "Meseros y chefs", icon: <IconUsers /> },
    { href: "/panel/qr", label: "Descargar QR", icon: <IconQr /> },
    { href: "/panel/reportes", label: "Reportes", icon: <IconChart /> },
    { href: "/panel/configuracion", label: "Configuración", icon: <IconSettings /> },
  ];

  return (
    <PageShell title={`Hola, ${member.display_name.split(" ")[0]}`} description={business.name}>
      <div className="space-y-6">
        {business.subscription_status === "trial" && (
          <Notice tone="info">Estás en el periodo de prueba de Klisto. Escríbenos cuando quieras activar tu plan.</Notice>
        )}
        {(products ?? 0) === 0 && (
          <Notice tone="info">
            Empieza por cargar tu menú en{" "}
            <Link href="/panel/menu" className="font-semibold underline">
              Menú
            </Link>{" "}
            y luego descarga tu código QR.
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Ventas de hoy" value={formatCOP(Number(todayRow?.sales ?? 0))} />
          <Stat label="Pedidos de hoy" value={String(todayRow?.orders_count ?? 0)} />
          <Stat label="Pedidos activos" value={String(active ?? 0)} href="/panel/cocina" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Pedidos en línea</h2>
              <p className="text-sm text-muted">
                Tu página:{" "}
                <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-ink underline">
                  {url.replace(/^https?:\/\//, "")}
                </a>
              </p>
            </div>
            <AcceptingOrdersToggle accepting={business.accepting_orders} />
          </div>
        </Card>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-4 font-semibold shadow-[0_1px_0_#D9DBE0] hover:ring-2 hover:ring-brand">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-dark">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
    </>
  );
  const cls = "block rounded-2xl bg-white p-5 shadow-[0_1px_0_#D9DBE0]";
  return href ? (
    <Link href={href} className={`${cls} hover:ring-2 hover:ring-brand`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
