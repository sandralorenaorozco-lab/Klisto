import "server-only";
import { randomBytes } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { loadCatalog } from "@/lib/data/catalog";
import { buildOrderCode } from "@/lib/orders/code";
import { OrderValidationError, priceItem, sumTotal, type PricedItem } from "@/lib/orders/pricing";
import { isOpenNow } from "@/lib/hours";
import { checkoutSchema, DATA_POLICY_VERSION, type CheckoutInput } from "@/lib/validation";
import { PAYMENT_PROVIDERS } from "@/lib/payments";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { formatCOP } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import type { OpeningHours, Product } from "@/lib/types";

export type CreateOrderResult =
  | { ok: true; code: string; token: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Crea un pedido desde la página pública.
 * 1. Valida los datos.  2. Verifica el negocio.  3. Recalcula precios con el
 * catálogo real.  4. Asigna el consecutivo del día y el código.  5. Guarda.
 * 6. Envía la confirmación por WhatsApp (si falla, el pedido igual queda).
 */
export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Revisa los datos del formulario.", fieldErrors };
  }
  const data = parsed.data;
  const db = getAdminSupabase();

  const { data: business, error: bizError } = await db
    .from("businesses")
    .select("id, slug, name, business_type, subscription_status, accepting_orders, opening_hours, timezone")
    .eq("slug", data.slug.toLowerCase())
    .maybeSingle();

  if (bizError || !business) return { ok: false, error: "No encontramos este negocio." };
  if (business.subscription_status === "suspended") {
    return { ok: false, error: "Este negocio no está recibiendo pedidos en este momento." };
  }
  if (business.business_type !== "restaurant") {
    return { ok: false, error: "Este negocio todavía no recibe pedidos en línea." };
  }
  if (!business.accepting_orders) {
    return { ok: false, error: "El negocio pausó los pedidos por ahora. Intenta más tarde." };
  }
  if (!isOpenNow(business.opening_hours as OpeningHours, business.timezone)) {
    return { ok: false, error: "El negocio está cerrado en este momento." };
  }

  // Recalcular precios con el catálogo de la base de datos.
  let priced: PricedItem[];
  try {
    const catalog = await loadCatalog(db, business.id);
    const products = new Map<string, Product>(catalog.flatMap((c) => c.products).map((p) => [p.id, p]));
    priced = data.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new OrderValidationError("Uno de los productos ya no está en el menú. Revisa tu pedido.");
      return priceItem(product, item);
    });
  } catch (e) {
    if (e instanceof OrderValidationError) return { ok: false, error: e.message };
    console.error("[pedido] Error cargando catálogo:", e);
    return { ok: false, error: "No pudimos procesar tu pedido. Intenta de nuevo." };
  }

  const total = sumTotal(priced);

  const { data: counter, error: counterError } = await db.rpc("next_order_number", { p_business_id: business.id });
  const next = (counter as { order_date: string; daily_number: number }[] | null)?.[0];
  if (counterError || !next) {
    console.error("[pedido] next_order_number:", counterError?.message);
    return { ok: false, error: "No pudimos procesar tu pedido. Intenta de nuevo." };
  }

  const code = buildOrderCode({
    customerName: data.customerName,
    phone: data.customerPhone,
    dailyNumber: next.daily_number,
  });
  const token = randomBytes(24).toString("base64url"); // 32 caracteres impredecibles

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      business_id: business.id,
      order_date: next.order_date,
      daily_number: next.daily_number,
      code,
      tracking_token: token,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      notes: data.notes || null,
      payment_method: data.paymentMethod,
      subtotal: total,
      total,
      data_consent_at: new Date().toISOString(),
      data_policy_version: DATA_POLICY_VERSION,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[pedido] insert orders:", orderError?.message);
    return { ok: false, error: "No pudimos guardar tu pedido. Intenta de nuevo." };
  }

  const { error: itemsError } = await db.from("order_items").insert(
    priced.map((p) => ({
      order_id: order.id,
      business_id: business.id,
      product_id: p.productId,
      product_name: p.productName,
      unit_price: p.unitPrice,
      quantity: p.quantity,
      modifiers: p.modifiers,
      notes: p.notes,
      line_total: p.lineTotal,
    })),
  );

  if (itemsError) {
    console.error("[pedido] insert order_items:", itemsError.message);
    await db.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "No pudimos guardar tu pedido. Intenta de nuevo." };
  }

  const trackingUrl = `${SITE_URL}/${business.slug}/pedido/${token}`;

  // Pago: hoy solo "pagar al recoger" (no requiere acción). Con Wompi devolvería una URL de pago.
  const payment = await PAYMENT_PROVIDERS[data.paymentMethod].startPayment({
    orderId: order.id,
    orderCode: code,
    amount: total,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    returnUrl: trackingUrl,
  });

  await sendWhatsAppTemplate({
    businessId: business.id,
    orderId: order.id,
    toPhone: data.customerPhone,
    template: "order_confirmed",
    params: [firstName(data.customerName), code, business.name, formatCOP(total), trackingUrl],
  }).catch((e) => console.error("[pedido] WhatsApp:", e));

  return { ok: true, code, token, redirectUrl: payment.kind === "redirect" ? payment.url : undefined };
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
