"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatCOP, formatPhone, formatTime } from "@/lib/format";
import { getTimelineIndex, STATUS_FLOW, STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";
import { IconCheck } from "@/components/ui/icons";
import type { TrackedOrder } from "@/lib/types";

const STATUS_HELP: Record<OrderStatus, string> = {
  received: "El negocio recibió tu pedido y lo va a empezar pronto.",
  preparing: "Tu pedido se está preparando.",
  packing: "Estamos empacando tu pedido.",
  ready: "¡Tu pedido está listo! Acércate y muestra tu código.",
  delivered: "Pedido entregado. ¡Gracias por tu compra!",
  cancelled: "Este pedido fue cancelado.",
};

const STEP_TIME: Record<OrderStatus, keyof TrackedOrder> = {
  received: "created_at",
  preparing: "preparing_at",
  packing: "packing_at",
  ready: "ready_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

export function TrackingView({
  token,
  initialOrder,
  isNew,
  trackingUrl,
}: {
  token: string;
  initialOrder: TrackedOrder;
  isNew: boolean;
  trackingUrl: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await getBrowserSupabase().rpc("get_order_by_token", { p_token: token });
    if (data) setOrder(data as TrackedOrder);
  }, [token]);

  // Tiempo real: canal Broadcast "order:<token>" que emite la base de datos.
  // Al recibir un aviso se vuelve a consultar (no se confía en el contenido del mensaje).
  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`order:${token}`)
      .on("broadcast", { event: "status_changed" }, () => void refresh())
      .subscribe((status: string) => setLive(status === "SUBSCRIBED"));

    // Respaldo: consulta periódica y al volver a la pestaña.
    const interval = setInterval(() => void refresh(), 20_000);
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [token, refresh]);

  const current = getTimelineIndex(order.status);
  const cancelled = order.status === "cancelled";
  const ready = order.status === "ready";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // portapapeles no disponible
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      {isNew && (
        <p role="status" className="rounded-2xl bg-ready px-4 py-3 font-semibold text-ready-ink">
          ¡Pedido confirmado! Guarda tu código y este enlace para seguirlo.
        </p>
      )}

      <section
        aria-live="polite"
        className={`rounded-3xl p-6 ${cancelled ? "bg-danger-soft text-danger" : ready ? "bg-ready text-ready-ink" : "bg-ink text-white"}`}
      >
        <p className="text-sm font-bold uppercase tracking-wider opacity-80">{STATUS_LABELS[order.status]}</p>
        <p className="mt-2 font-display text-5xl font-extrabold tracking-tight">{order.code}</p>
        <p className="mt-3 text-lg">{STATUS_HELP[order.status]}</p>
        {cancelled && order.cancel_reason && <p className="mt-1">Motivo: {order.cancel_reason}</p>}
        <p className="mt-4 flex items-center gap-2 text-xs opacity-80">
          <span className={`size-2 rounded-full ${live ? "bg-current" : "border border-current"}`} aria-hidden="true" />
          {live ? "Se actualiza en tiempo real" : "Actualizando automáticamente"}
        </p>
      </section>

      {!cancelled && (
        <section aria-labelledby="timeline">
          <h2 id="timeline" className="sr-only">
            Estado del pedido
          </h2>
          <ol className="relative">
            {STATUS_FLOW.map((status, i) => {
              const done = i <= current;
              const isCurrent = i === current;
              const time = order[STEP_TIME[status]] as string | null;
              return (
                <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STATUS_FLOW.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${i < current ? "bg-ink" : "bg-line"}`}
                    />
                  )}
                  <span
                    className={`relative grid size-8 shrink-0 place-items-center rounded-full ${
                      isCurrent ? (ready ? "bg-ready-ink text-white" : "bg-[var(--biz)] text-[var(--biz-ink)]") : done ? "bg-ink text-white" : "border-2 border-line bg-white"
                    }`}
                  >
                    {done && <IconCheck size={16} strokeWidth={3} />}
                  </span>
                  <div className="pt-1">
                    <p className={`${isCurrent ? "font-bold" : done ? "font-semibold" : "text-muted"}`}>
                      {STATUS_LABELS[status]}
                      {isCurrent && <span className="sr-only"> (estado actual)</span>}
                    </p>
                    {done && time && <p className="text-sm text-muted">{formatTime(time)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="rounded-2xl border border-line p-5" aria-labelledby="detalle">
        <h2 id="detalle" className="font-display text-lg font-bold">
          Detalle de tu pedido
        </h2>
        <p className="text-sm text-muted">
          A nombre de {order.customer_name} · celular terminado en {order.customer_phone_last4}
        </p>
        <ul className="mt-4 space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {item.quantity} × {item.product_name}
                </p>
                {item.modifiers.length > 0 && <p className="text-sm text-muted">{item.modifiers.map((m) => m.option).join(" · ")}</p>}
                {item.notes && <p className="text-sm italic text-ink-soft">“{item.notes}”</p>}
              </div>
              <p className="shrink-0 font-semibold">{formatCOP(item.line_total)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatCOP(order.total)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {order.payment_method === "pay_at_pickup" ? "Pagas al recoger." : "Pago en línea."}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl bg-mist p-5">
        <p className="font-semibold">Enlace de seguimiento</p>
        <p className="break-all text-sm text-ink-soft">{trackingUrl}</p>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold shadow-[0_1px_0_#D9DBE0]"
        >
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </button>
        {order.business.phone && (
          <p className="text-sm text-ink-soft">
            ¿Dudas? Llama a {order.business.name} al{" "}
            <a href={`tel:+57${order.business.phone}`} className="font-semibold underline">
              {formatPhone(order.business.phone)}
            </a>
            .
          </p>
        )}
      </section>

      <Link href={`/${order.business.slug}`} className="inline-flex min-h-11 items-center font-semibold underline">
        Volver al menú
      </Link>
    </div>
  );
}
