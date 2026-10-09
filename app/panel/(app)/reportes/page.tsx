import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageShell, Card } from "@/components/panel/page-shell";
import { formatCOP, formatDate, lastNDays } from "@/lib/format";

export const metadata: Metadata = { title: "Reportes" };

const RANGES = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

export default async function ReportsPage({ searchParams }: PageProps<"/panel/reportes">) {
  const { business } = await requirePanel(["owner"]);
  const { dias } = await searchParams;
  const days = RANGES.find((r) => String(r.days) === dias)?.days ?? 7;

  const range = lastNDays(days, business.timezone);
  const from = range[0];
  const to = range[range.length - 1];

  const supabase = await getServerSupabase();
  const [{ data: daily }, { data: top }] = await Promise.all([
    supabase.rpc("report_sales_by_day", { p_business_id: business.id, p_from: from, p_to: to }),
    supabase.rpc("report_top_products", { p_business_id: business.id, p_from: from, p_to: to, p_limit: 10 }),
  ]);

  const byDay = new Map(((daily ?? []) as { day: string; orders_count: number; sales: number }[]).map((d) => [d.day, d]));
  // Todos los días del rango, incluso los que no tuvieron ventas.
  const rows = range.map((day) => {
    const d = byDay.get(day);
    return { day, orders: Number(d?.orders_count ?? 0), sales: Number(d?.sales ?? 0) };
  });
  const totalSales = rows.reduce((a, r) => a + r.sales, 0);
  const totalOrders = rows.reduce((a, r) => a + r.orders, 0);
  const max = Math.max(1, ...rows.map((r) => r.sales));
  const products = (top ?? []) as { product_name: string; quantity: number; revenue: number }[];
  const maxQty = Math.max(1, ...products.map((p) => Number(p.quantity)));

  return (
    <PageShell
      title="Reportes"
      description="Pedidos y ventas (sin contar los cancelados)."
      actions={
        <nav aria-label="Periodo" className="flex gap-1 rounded-xl bg-white p-1 shadow-[0_1px_0_#D9DBE0]">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/panel/reportes?dias=${r.days}`}
              aria-current={r.days === days ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${r.days === days ? "bg-ink text-white" : "text-ink-soft"}`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Ventas" value={formatCOP(totalSales)} />
          <Stat label="Pedidos" value={String(totalOrders)} />
          <Stat label="Ticket promedio" value={totalOrders ? formatCOP(totalSales / totalOrders) : "—"} />
        </div>

        <Card>
          <h2 className="font-display text-xl font-bold">Ventas por día</h2>
          <table className="mt-4 w-full text-left text-sm">
            <caption className="sr-only">Pedidos y ventas por día</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 font-semibold">Día</th>
                <th scope="col" className="w-1/2 py-2 font-semibold">
                  <span className="sr-only">Gráfica</span>
                </th>
                <th scope="col" className="py-2 text-right font-semibold">Pedidos</th>
                <th scope="col" className="py-2 text-right font-semibold">Ventas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...rows].reverse().map((r) => (
                <tr key={r.day}>
                  <td className="whitespace-nowrap py-2 pr-3">{formatDate(r.day)}</td>
                  <td className="py-2 pr-3" aria-hidden="true">
                    <div className="h-3 rounded-full bg-mist">
                      <div className="h-3 rounded-full bg-brand" style={{ width: `${(r.sales / max) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.orders}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{formatCOP(r.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">Productos más vendidos</h2>
          {products.length === 0 ? (
            <p className="mt-2 text-muted">Aún no hay ventas en este periodo.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {products.map((p, i) => (
                <li key={p.product_name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3">
                  <span className="font-display text-lg font-bold text-muted">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{p.product_name}</p>
                    <div className="mt-1 h-2 rounded-full bg-mist" aria-hidden="true">
                      <div className="h-2 rounded-full bg-ink" style={{ width: `${(Number(p.quantity) / maxQty) * 100}%` }} />
                    </div>
                  </div>
                  <p className="text-right text-sm">
                    <span className="font-bold">{Number(p.quantity)} und.</span>
                    <br />
                    <span className="text-muted">{formatCOP(Number(p.revenue))}</span>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_0_#D9DBE0]">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
