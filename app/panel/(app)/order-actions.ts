"use server";

import { revalidatePath } from "next/cache";
import { getPanelSession } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { assertCanChangeStatus, isOrderStatus, StatusTransitionError, type OrderStatus } from "@/lib/orders/status";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { firstName } from "@/lib/orders/create-order";

export type StatusResult = { ok: true } | { ok: false; error: string };

/**
 * Cambia el estado de un pedido. Se valida aquí (mensajes claros) y otra vez en
 * la base de datos (trigger orders_guard_update), que es la que manda.
 */
export async function changeOrderStatus(orderId: string, to: OrderStatus, cancelReason?: string): Promise<StatusResult> {
  const session = await getPanelSession();
  if (!session) return { ok: false, error: "Tu sesión terminó. Vuelve a entrar." };
  if (!isOrderStatus(to)) return { ok: false, error: "Estado no válido." };

  const supabase = await getServerSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, business_id, status, code, customer_name, customer_phone")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.business_id !== session.business.id) return { ok: false, error: "No encontramos el pedido." };

  try {
    assertCanChangeStatus(order.status as OrderStatus, to, session.member.role);
  } catch (e) {
    if (e instanceof StatusTransitionError) return { ok: false, error: e.message };
    throw e;
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: to, ...(to === "cancelled" ? { cancel_reason: cancelReason?.slice(0, 200) || null } : {}) })
    .eq("id", orderId)
    .eq("status", order.status) // evita pisar un cambio hecho al mismo tiempo desde otra pantalla
    .select("id");
  if (error || !updated?.length) {
    if (error) console.error("[estado] update:", error.message);
    return { ok: false, error: "No se pudo actualizar. Es posible que otra persona ya lo haya cambiado." };
  }

  if (to === "ready") {
    await sendWhatsAppTemplate({
      businessId: order.business_id,
      orderId: order.id,
      toPhone: order.customer_phone,
      template: "order_ready",
      params: [firstName(order.customer_name), order.code, session.business.name],
    }).catch((e) => console.error("[estado] WhatsApp:", e));
  }

  revalidatePath("/panel/pedidos");
  return { ok: true };
}

/** Pausar o reanudar los pedidos en línea (solo el dueño). */
export async function setAcceptingOrders(accepting: boolean): Promise<StatusResult> {
  const session = await getPanelSession();
  if (!session || session.member.role !== "owner") return { ok: false, error: "Solo el dueño puede hacer esto." };
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("businesses").update({ accepting_orders: accepting }).eq("id", session.business.id);
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/panel", "layout");
  return { ok: true };
}

