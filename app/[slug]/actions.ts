"use server";

import { redirect } from "next/navigation";
import { createOrder, type CreateOrderResult } from "@/lib/orders/create-order";
import { normalizeOrderCode } from "@/lib/orders/code";
import { getServerSupabase } from "@/lib/supabase/server";
import { normalizeColombianMobile } from "@/lib/validation";
import type { CheckoutInput } from "@/lib/validation";

export async function placeOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  return createOrder(input);
}

export type LookupState = { error?: string };

/** Consulta con código + celular completo. Si coinciden, lleva a la página de seguimiento. */
export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const slug = String(formData.get("slug") ?? "");
  const code = normalizeOrderCode(String(formData.get("code") ?? ""));
  const phone = normalizeColombianMobile(String(formData.get("phone") ?? ""));

  if (!code || !/^3\d{9}$/.test(phone)) {
    return { error: "Escribe el código del pedido y el celular de 10 dígitos con el que lo hiciste." };
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("lookup_order", { p_slug: slug, p_code: code, p_phone: phone });
  if (error || !data) {
    return { error: "No encontramos un pedido con ese código y ese celular. Revisa los datos." };
  }
  redirect(`/${slug}/pedido/${data as string}`);
}
