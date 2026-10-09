"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { fetchOrders } from "@/lib/data/orders";
import { changeOrderStatus } from "@/app/panel/(app)/order-actions";
import {
  ACTIVE_STATUSES,
  ADVANCE_LABELS,
  getNextStatus,
  roleCanSetStatus,
  STATUS_LABELS,
  type MemberRole,
  type OrderStatus,
} from "@/lib/orders/status";
import { formatCOP, formatElapsed, formatPhone } from "@/lib/format";
import { IconVolume, IconX } from "@/components/ui/icons";
import type { Order } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  received: "bg-brand text-ink",
  preparing: "bg-[#FFE3D5] text-[#7a2d0a]",
  packing: "bg-[#E7E9EE] text-ink",
  ready: "bg-ready text-ready-ink",
  delivered: "bg-mist text-muted",
  cancelled: "bg-danger-soft text-danger",
};

const CANCEL_REASONS = ["Producto agotado", "El cliente lo pidió", "El cliente no llegó", "Pedido duplicado", "Otro motivo"];

export function KitchenBoard({
  businessId,
  role,
  initialOrders,
}: {
  businessId: string;
  role: MemberRole;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [now, setNow] = useState(() => new Date());
  const [soundOn, setSoundOn] = useState(false);
  const [live, setLive] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)));
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);

  // ---- Sonido de alerta (Web Audio, sin archivos) ----
  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx || !soundRef.current) return;
    const start = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.2);
    });
  }, []);

  function enableSound() {
    // Los navegadores solo permiten audio después de que la persona toca la pantalla.
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioRef.current ??= new Ctx();
    void audioRef.current.resume();
    soundRef.current = true;
    setSoundOn(true);
    beep();
  }

  function disableSound() {
    soundRef.current = false;
    setSoundOn(false);
  }

  // ---- Datos ----
  const refresh = useCallback(async () => {
    try {
      const list = await fetchOrders(getBrowserSupabase(), businessId, { statuses: ACTIVE_STATUSES });
      const newOnes = list.filter((o) => !knownIds.current.has(o.id));
      list.forEach((o) => knownIds.current.add(o.id));
      if (newOnes.length > 0) {
        beep();
        setFreshIds((prev) => new Set([...prev, ...newOnes.map((o) => o.id)]));
        setTimeout(() => {
          setFreshIds((prev) => {
            const next = new Set(prev);
            newOnes.forEach((o) => next.delete(o.id));
            return next;
          });
        }, 15_000);
      }
      setOrders(list);
    } catch (e) {
      console.error(e);
    }
  }, [businessId, beep]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`kitchen:${businessId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `business_id=eq.${businessId}` }, () => {
        void refresh();
      })
      .subscribe((status: string) => setLive(status === "SUBSCRIBED"));

    // Respaldo si Realtime no está disponible y reloj de "tiempo transcurrido".
    const poll = setInterval(() => void refresh(), 15_000);
    const clock = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
      void supabase.removeChannel(channel);
    };
  }, [businessId, refresh]);

  function advance(order: Order, to: OrderStatus, reason?: string) {
    setError(null);
    setPendingId(order.id);
    // Actualización optimista: la tarjeta cambia de inmediato.
    setOrders((prev) =>
      to === "delivered" || to === "cancelled" ? prev.filter((o) => o.id !== order.id) : prev.map((o) => (o.id === order.id ? { ...o, status: to } : o)),
    );
    startTransition(async () => {
      const result = await changeOrderStatus(order.id, to, reason);
      if (!result.ok) setError(`${order.code}: ${result.error}`);
      await refresh();
      setPendingId(null);
    });
  }

  const counts = ACTIVE_STATUSES.map((s) => ({ status: s, n: orders.filter((o) => o.status === s).length }));

  return (
    <div className="flex flex-1 flex-col bg-[#0E1014] text-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
        <h1 className="font-display text-2xl font-bold">Cocina</h1>
        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Resumen">
          {counts.map((c) => (
            <li key={c.status} className={`rounded-full px-3 py-1 font-semibold ${STATUS_STYLE[c.status]}`}>
              {STATUS_LABELS[c.status]}: {c.n}
            </li>
          ))}
        </ul>
        <span className="ml-auto flex items-center gap-2 text-xs text-white/60">
          <span className={`size-2 rounded-full ${live ? "bg-[#3DDC84]" : "bg-white/40"}`} aria-hidden="true" />
          {live ? "En vivo" : "Actualizando cada 15 s"}
        </span>
        <button
          type="button"
          onClick={soundOn ? disableSound : enableSound}
          aria-pressed={soundOn}
          className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-4 font-semibold ${soundOn ? "bg-white/10 text-white" : "bg-brand text-ink"}`}
        >
          <IconVolume size={20} />
          {soundOn ? "Sonido activado" : "Activar sonido"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-xl bg-danger px-4 py-3 font-semibold">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="grid flex-1 place-items-center p-10 text-center text-white/60">
          <div>
            <p className="font-display text-3xl font-bold text-white">Sin pedidos activos</p>
            <p className="mt-2">Los pedidos nuevos aparecerán aquí automáticamente.</p>
          </div>
        </div>
      ) : (
        <ol className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Pedidos por orden de llegada">
          {orders.map((order) => {
            const next = getNextStatus(order.status);
            const canAdvance = next && roleCanSetStatus(role, next);
            const canCancel = roleCanSetStatus(role, "cancelled");
            const minutes = (now.getTime() - new Date(order.created_at).getTime()) / 60000;
            const late = minutes > 20 && order.status !== "ready";
            return (
              <li
                key={order.id}
                className={`flex flex-col overflow-hidden rounded-2xl bg-white text-ink ${freshIds.has(order.id) ? "ring-4 ring-brand" : ""}`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                  <div>
                    <p className="font-display text-3xl font-extrabold tracking-tight">{order.code}</p>
                    <p className="text-lg font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">{formatPhone(order.customer_phone)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${STATUS_STYLE[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className={`mt-2 text-sm font-semibold ${late ? "text-danger" : "text-muted"}`}>
                      {formatElapsed(order.created_at, now)}
                    </p>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 p-4">
                  {order.order_items.map((item, i) => (
                    <li key={item.id ?? i}>
                      <p className="text-lg font-bold leading-snug">
                        <span className="mr-2 inline-grid min-w-8 place-items-center rounded-md bg-ink px-1.5 text-white">
                          {item.quantity}
                        </span>
                        {item.product_name}
                      </p>
                      {item.modifiers.length > 0 && (
                        <p className="ml-10 text-ink-soft">{item.modifiers.map((m) => m.option).join(" · ")}</p>
                      )}
                      {item.notes && (
                        <p className="ml-10 mt-1 inline-block rounded-md bg-[#FFF4CC] px-2 py-0.5 font-semibold text-[#5C4400]">
                          Nota: {item.notes}
                        </p>
                      )}
                    </li>
                  ))}
                  {order.notes && (
                    <li className="rounded-lg bg-mist px-3 py-2 text-sm">
                      <span className="font-semibold">Comentario del cliente:</span> {order.notes}
                    </li>
                  )}
                </ul>

                <div className="flex items-center gap-2 border-t border-line p-3">
                  {canAdvance && next ? (
                    <button
                      type="button"
                      onClick={() => advance(order, next)}
                      disabled={pendingId === order.id}
                      className={`min-h-16 flex-1 rounded-xl px-4 text-lg font-bold disabled:opacity-60 ${
                        next === "ready" ? "bg-ready-ink text-white" : next === "delivered" ? "bg-ink text-white" : "bg-brand text-ink"
                      }`}
                    >
                      {ADVANCE_LABELS[next]}
                    </button>
                  ) : (
                    <p className="flex min-h-16 flex-1 items-center px-2 font-semibold text-muted">
                      {order.status === "ready" ? `Listo · ${formatCOP(order.total)} por cobrar` : "Esperando a cocina"}
                    </p>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelling(order)}
                      className="grid size-16 place-items-center rounded-xl bg-danger-soft text-danger"
                      aria-label={`Cancelar pedido ${order.code}`}
                    >
                      <IconX />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {cancelling && (
        <CancelDialog
          order={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={(reason) => {
            advance(cancelling, "cancelled", reason);
            setCancelling(null);
          }}
        />
      )}
    </div>
  );
}

function CancelDialog({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (reason: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="cancel-title" className="m-auto w-[min(92vw,28rem)] rounded-3xl p-6 text-ink backdrop:bg-black/70">
      <h2 id="cancel-title" className="font-display text-2xl font-bold">
        ¿Cancelar el pedido {order.code}?
      </h2>
      <fieldset className="mt-4 space-y-1">
        <legend className="mb-2 font-semibold">Motivo</legend>
        {CANCEL_REASONS.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="size-5 accent-[#FF6A2B]" />
            {r}
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl border-2 border-line font-semibold">
          Volver
        </button>
        <button type="button" onClick={() => onConfirm(reason)} className="min-h-12 flex-1 rounded-xl bg-danger font-semibold text-white">
          Sí, cancelar
        </button>
      </div>
    </dialog>
  );
}
