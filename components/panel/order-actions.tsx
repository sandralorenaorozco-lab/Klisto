"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeOrderStatus } from "@/app/panel/(app)/order-actions";
import { ADVANCE_LABELS, getNextStatus, roleCanSetStatus, type MemberRole, type OrderStatus } from "@/lib/orders/status";

export function OrderActions({ orderId, code, status, role }: { orderId: string; code: string; status: OrderStatus; role: MemberRole }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = getNextStatus(status);
  const canAdvance = next && roleCanSetStatus(role, next);
  const canCancel = next && roleCanSetStatus(role, "cancelled");
  if (!canAdvance && !canCancel) return null;

  function run(to: OrderStatus) {
    if (to === "cancelled" && !window.confirm(`¿Cancelar el pedido ${code}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, to, to === "cancelled" ? "Cancelado desde el panel" : undefined);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      {canAdvance && next && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(next)}
          className={`min-h-12 flex-1 rounded-xl px-4 font-bold disabled:opacity-60 ${next === "delivered" ? "bg-ink text-white" : next === "ready" ? "bg-ready-ink text-white" : "bg-brand text-ink"}`}
        >
          {ADVANCE_LABELS[next]}
        </button>
      )}
      {canCancel && (
        <button type="button" disabled={pending} onClick={() => run("cancelled")} className="min-h-12 rounded-xl bg-danger-soft px-4 font-semibold text-danger">
          Cancelar
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
