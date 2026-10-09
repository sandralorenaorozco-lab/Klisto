import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { toWhatsAppNumber } from "@/lib/format";

/**
 * Notificaciones por WhatsApp con la API oficial de WhatsApp Business Cloud (Meta).
 * Usa plantillas aprobadas en el WhatsApp Manager. NO usa librerías no oficiales.
 *
 * Si faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID se activa el "modo simulado":
 * el mensaje se escribe en la consola y en la tabla notifications_log.
 *
 * Plantillas esperadas (categoría "Utilidad", idioma es_CO):
 *   pedido_confirmado: "Hola {{1}}, recibimos tu pedido {{2}} en {{3}}. Total: {{4}}.
 *                       Mira el estado aquí: {{5}}"
 *   pedido_listo:      "{{1}}, tu pedido {{2}} ya está listo para recoger en {{3}}.
 *                       Muestra este código al recogerlo."
 */

export type WhatsAppTemplate = "order_confirmed" | "order_ready";

const TEMPLATE_NAMES: Record<WhatsAppTemplate, string> = {
  order_confirmed: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED || "pedido_confirmado",
  order_ready: process.env.WHATSAPP_TEMPLATE_ORDER_READY || "pedido_listo",
};

/** Texto equivalente a la plantilla, para el modo simulado y el registro. */
const PREVIEW: Record<WhatsAppTemplate, (p: string[]) => string> = {
  order_confirmed: ([name, code, business, total, url]) =>
    `Hola ${name}, recibimos tu pedido ${code} en ${business}. Total: ${total}. Mira el estado aquí: ${url}`,
  order_ready: ([name, code, business]) =>
    `${name}, tu pedido ${code} ya está listo para recoger en ${business}. Muestra este código al recogerlo.`,
};

export type SendResult = { ok: boolean; mode: "simulated" | "live"; messageId?: string; error?: string };

export function isWhatsAppLive(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppTemplate(input: {
  businessId: string;
  orderId?: string;
  toPhone: string;
  template: WhatsAppTemplate;
  params: string[];
}): Promise<SendResult> {
  const to = toWhatsAppNumber(input.toPhone);
  const templateName = TEMPLATE_NAMES[input.template];
  const preview = PREVIEW[input.template](input.params);
  const live = isWhatsAppLive();

  let result: SendResult;

  if (!live) {
    console.info(`[WhatsApp simulado] → +${to} (${templateName})\n${preview}`);
    result = { ok: true, mode: "simulated" };
  } else {
    result = await callCloudApi(to, templateName, input.params);
  }

  await logNotification({
    businessId: input.businessId,
    orderId: input.orderId,
    template: templateName,
    to,
    payload: { params: input.params, preview },
    result,
  });

  return result;
}

async function callCloudApi(to: string, templateName: string, params: string[]): Promise<SendResult> {
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es_CO" },
          components: [
            { type: "body", parameters: params.map((text) => ({ type: "text", text })) },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };

    if (!response.ok) {
      return { ok: false, mode: "live", error: body.error?.message ?? `HTTP ${response.status}` };
    }
    return { ok: true, mode: "live", messageId: body.messages?.[0]?.id };
  } catch (error) {
    return { ok: false, mode: "live", error: error instanceof Error ? error.message : String(error) };
  }
}

async function logNotification(entry: {
  businessId: string;
  orderId?: string;
  template: string;
  to: string;
  payload: Record<string, unknown>;
  result: SendResult;
}) {
  try {
    const { error } = await getAdminSupabase().from("notifications_log").insert({
      business_id: entry.businessId,
      order_id: entry.orderId ?? null,
      channel: "whatsapp",
      template: entry.template,
      to_phone: entry.to,
      payload: entry.payload,
      mode: entry.result.mode,
      status: entry.result.ok ? "sent" : "failed",
      provider_message_id: entry.result.messageId ?? null,
      error: entry.result.error ?? null,
    });
    if (error) console.error("[WhatsApp] No se pudo registrar la notificación:", error.message);
  } catch (error) {
    console.error("[WhatsApp] No se pudo registrar la notificación:", error);
  }
}
