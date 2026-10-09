import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { fetchOrders } from "@/lib/data/orders";
import { PageShell } from "@/components/panel/page-shell";
import { OrderActions } from "@/components/panel/order-actions";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatPhone, formatTime, localDateString } from "@/lib/format";
import { isOrderStatus, STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";
import { normalizeOrderCode } from "@/lib/orders/code";

export const metadata: Metadata = { title: "Pedidos" };

const TONE: Record<OrderStatus, "brand" | "neutral" | "ready" | "danger" | "dark"> = {
  received: "brand",
  preparing: "brand",
  packing: "neutral",
  ready: "ready",
  delivered: "dark",
  cancelled: "danger",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ready", label: "Listos para entregar" },
  { value: "received", label: "Recibidos" },
  { value: "preparing", label: "En preparación" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/panel/pedidos">) {
  const { business, member } = await requirePanel(["owner", "chef", "waiter"]);
  const sp = await searchParams;
  const today = localDateString(new Date(), business.timezone);
  const date = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : today;
  const status = typeof sp.estado === "string" && isOrderStatus(sp.estado) ? sp.estado : null;
  const q = typeof sp.q === "string" ? normalizeOrderCode(sp.q) : "";

  const supabase = await getServerSupabase();
  let orders = await fetchOrders(supabase, business.id, { date, statuses: status ? [status] : undefined, limit: 500 });
  if (q) orders = orders.filter((o) => o.code.includes(q) || o.customer_phone.endsWith(q.replace(/\D/g, "") || "x"));
  orders.reverse(); // más recientes primero

  const link = (params: Record<string, string>) => {
    const s = new URLSearchParams({ fecha: date, ...(status ? { estado: status } : {}), ...params });
    for (const [k, v] of [...s.entries()]) if (!v) s.delete(k);
    return `/panel/pedidos?${s.toString()}`;
  };

  return (
    <PageShell title="Pedidos" description={date === today ? "Pedidos de hoy." : `Pedidos del ${date}.`} wide>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form className="flex flex-wrap items-end gap-2" action="/panel/pedidos">
          {status && <input type="hidden" name="estado" value={status} />}
          <label className="flex flex-col text-sm font-semibold">
            Fecha
            <input type="date" name="fecha" defaultValue={date} max={today} className="mt-1 min-h-11 rounded-lg border-2 border-line bg-white px-2 font-normal" />
          </label>
          <label className="flex flex-col text-sm font-semibold">
            Código o celular
            <input name="q" defaultValue={q} placeholder="SLO-4521-05" className="mt-1 min-h-11 w-44 rounded-lg border-2 border-line bg-white px-3 font-normal" />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white">
            Buscar
          </button>
        </form>
      </div>

      <nav aria-label="Filtrar por estado" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={link({ estado: f.value })}
            aria-current={(status ?? "") === f.value ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold ${
              (status ?? "") === f.value ? "bg-ink text-white" : "bg-white text-ink-soft shadow-[0_1px_0_#D9DBE0]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-muted">No hay pedidos con estos filtros.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_0_#D9DBE0]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-2xl font-bold">{o.code}</p>
                  <p className="text-sm text-ink-soft">
                    {o.customer_name} · {formatPhone(o.customer_phone)} · {formatTime(o.created_at, business.timezone)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  <p className="mt-1 font-bold">{formatCOP(o.total)}</p>
                </div>
              </div>
              <p className="text-sm text-ink-soft">
                {o.order_items.map((i) => `${i.quantity} × ${i.product_name}`).join(" · ")}
              </p>
              <OrderActions orderId={o.id} code={o.code} status={o.status} role={member.role} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
