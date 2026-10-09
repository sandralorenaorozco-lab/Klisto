import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/lib/types";
import type { OrderStatus } from "@/lib/orders/status";

const ORDER_COLUMNS =
  "id, business_id, code, daily_number, order_date, customer_name, customer_phone, notes, status, total, payment_method, payment_status, created_at, ready_at";

/** Pedidos con sus productos. Funciona en servidor y navegador (respeta RLS). */
export async function fetchOrders(
  supabase: SupabaseClient,
  businessId: string,
  filter: { statuses?: readonly OrderStatus[]; date?: string; limit?: number } = {},
): Promise<Order[]> {
  let query = supabase.from("orders").select(ORDER_COLUMNS).eq("business_id", businessId);
  if (filter.statuses) query = query.in("status", filter.statuses as OrderStatus[]);
  if (filter.date) query = query.eq("order_date", filter.date);
  const { data: orders, error } = await query.order("created_at", { ascending: true }).limit(filter.limit ?? 200);
  if (error) throw new Error(error.message);
  if (!orders?.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, product_name, quantity, unit_price, line_total, modifiers, notes")
    .in(
      "order_id",
      orders.map((o) => o.id),
    );
  if (itemsError) throw new Error(itemsError.message);

  const byOrder = new Map<string, Order["order_items"]>();
  for (const item of items ?? []) {
    byOrder.set(item.order_id, [...(byOrder.get(item.order_id) ?? []), item]);
  }
  return orders.map((o) => ({ ...(o as Omit<Order, "order_items">), order_items: byOrder.get(o.id) ?? [] }));
}
