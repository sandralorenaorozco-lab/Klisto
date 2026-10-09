"use client";

import { useOptimistic, useTransition } from "react";
import { setAcceptingOrders } from "@/app/panel/(app)/order-actions";

export function AcceptingOrdersToggle({ accepting }: { accepting: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(accepting);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setAcceptingOrders(!optimistic);
        })
      }
      className={`inline-flex min-h-12 items-center gap-3 rounded-full px-5 font-bold ${optimistic ? "bg-ready text-ready-ink" : "bg-danger-soft text-danger"}`}
    >
      <span className={`relative h-6 w-11 rounded-full ${optimistic ? "bg-ready-ink" : "bg-danger"}`} aria-hidden="true">
        <span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${optimistic ? "left-6" : "left-1"}`} />
      </span>
      {optimistic ? "Recibiendo pedidos" : "Pedidos pausados"}
    </button>
  );
}
