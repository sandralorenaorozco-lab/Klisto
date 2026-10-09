import "server-only";
import { cache } from "react";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, ModifierGroup, ModifierOption, Product, PublicBusiness } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Datos públicos del negocio (incluye si está disponible o suspendido). */
export const getPublicBusiness = cache(async (slug: string): Promise<PublicBusiness | null> => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("get_public_business", { p_slug: slug });
  if (error) {
    console.error("[catálogo] get_public_business:", error.message);
    return null;
  }
  return (data as PublicBusiness | null) ?? null;
});

type Options = { includeInactive?: boolean };

/**
 * Carga el catálogo completo de un negocio y lo arma en memoria.
 * Recibe el cliente para poder usarlo con RLS (público/panel) o con la clave
 * secreta (al crear pedidos en el servidor).
 */
export async function loadCatalog(
  supabase: SupabaseClient,
  businessId: string,
  { includeInactive = false }: Options = {},
): Promise<Category[]> {
  const [cats, prods, groups, opts] = await Promise.all([
    supabase.from("categories").select("id, name, sort_order, is_active").eq("business_id", businessId).order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, name, description, price, image_url, is_available, sort_order")
      .eq("business_id", businessId)
      .order("sort_order"),
    supabase
      .from("modifier_groups")
      .select("id, product_id, name, min_select, max_select, sort_order")
      .eq("business_id", businessId)
      .order("sort_order"),
    supabase
      .from("modifier_options")
      .select("id, group_id, name, price_delta, is_available, sort_order")
      .eq("business_id", businessId)
      .order("sort_order"),
  ]);

  const failed = [cats, prods, groups, opts].find((r) => r.error);
  if (failed?.error) throw new Error(`No se pudo cargar el menú: ${failed.error.message}`);

  const optionsByGroup = new Map<string, ModifierOption[]>();
  for (const o of (opts.data ?? []) as ModifierOption[]) {
    optionsByGroup.set(o.group_id, [...(optionsByGroup.get(o.group_id) ?? []), o]);
  }
  const groupsByProduct = new Map<string, ModifierGroup[]>();
  for (const g of (groups.data ?? []) as Omit<ModifierGroup, "options">[]) {
    const group: ModifierGroup = { ...g, options: optionsByGroup.get(g.id) ?? [] };
    groupsByProduct.set(g.product_id, [...(groupsByProduct.get(g.product_id) ?? []), group]);
  }
  const productsByCategory = new Map<string, Product[]>();
  for (const p of (prods.data ?? []) as Omit<Product, "modifier_groups">[]) {
    const product: Product = { ...p, modifier_groups: groupsByProduct.get(p.id) ?? [] };
    productsByCategory.set(p.category_id, [...(productsByCategory.get(p.category_id) ?? []), product]);
  }

  return ((cats.data ?? []) as Omit<Category, "products">[])
    .filter((c) => includeInactive || c.is_active)
    .map((c) => ({ ...c, products: productsByCategory.get(c.id) ?? [] }))
    .filter((c) => includeInactive || c.products.length > 0);
}

export const getPublicCatalog = cache(async (businessId: string) => {
  const supabase = await getServerSupabase();
  return loadCatalog(supabase, businessId);
});
