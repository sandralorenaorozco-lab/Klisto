"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, getFile, ownerContext, parsePesos, uploadBusinessImage, type ActionState } from "@/lib/panel";

const refresh = () => {
  revalidatePath("/panel/menu", "layout");
};

// ---------- Categorías ----------
export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { session, supabase } = await ownerContext();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, errors: { name: "Escribe el nombre de la categoría." } };
    const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("business_id", session.business.id);
    const { error } = await supabase.from("categories").insert({ business_id: session.business.id, name: name.slice(0, 60), sort_order: count ?? 0 });
    if (error) throw error;
    refresh();
    return { ok: true, message: "Categoría creada." };
  } catch (e) {
    return fail(e);
  }
}

export async function updateCategory(formData: FormData) {
  const { supabase } = await ownerContext();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const isActive = formData.get("is_active") === "on";
  if (name) await supabase.from("categories").update({ name, is_active: isActive }).eq("id", id);
  refresh();
}

export async function moveCategory(formData: FormData) {
  const { session, supabase } = await ownerContext();
  const id = String(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const { data } = await supabase.from("categories").select("id, sort_order").eq("business_id", session.business.id).order("sort_order");
  const list = data ?? [];
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((c, idx) => supabase.from("categories").update({ sort_order: idx }).eq("id", c.id)));
  refresh();
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await ownerContext();
  const id = String(formData.get("id"));
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) return; // la interfaz solo permite borrar categorías vacías
  await supabase.from("categories").delete().eq("id", id);
  refresh();
}

// ---------- Productos ----------
const productSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre.").max(80),
  description: z.string().trim().max(400).optional(),
  category_id: z.uuid("Elige una categoría."),
  price: z.number({ message: "Escribe el precio." }).int().min(0),
});

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let productId = String(formData.get("id") ?? "");
  try {
    const { session, supabase } = await ownerContext();
    const parsed = productSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      category_id: formData.get("category_id"),
      price: parsePesos(formData.get("price")) ?? undefined,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { ok: false, errors, message: "Revisa los campos marcados." };
    }

    const values: Record<string, unknown> = {
      ...parsed.data,
      description: parsed.data.description ?? null,
      is_available: formData.get("is_available") === "on",
    };

    const image = getFile(formData, "image");
    if (image) values.image_url = await uploadBusinessImage(session.business.id, "products", image);
    if (formData.get("remove_image") === "on") values.image_url = null;

    if (productId) {
      const { error } = await supabase.from("products").update(values).eq("id", productId).eq("business_id", session.business.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...values, business_id: session.business.id, sort_order: 999 })
        .select("id")
        .single();
      if (error) throw error;
      productId = data.id;
    }
    refresh();
  } catch (e) {
    return fail(e);
  }
  if (!formData.get("id")) redirect(`/panel/menu/${productId}?creado=1`);
  return { ok: true, message: "Cambios guardados." };
}

export async function toggleProductAvailability(formData: FormData) {
  const { supabase } = await ownerContext();
  await supabase
    .from("products")
    .update({ is_available: formData.get("available") === "true" })
    .eq("id", String(formData.get("id")));
  refresh();
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await ownerContext();
  await supabase.from("products").delete().eq("id", String(formData.get("id")));
  refresh();
  redirect("/panel/menu");
}

// ---------- Modificadores ----------
function groupLimits(formData: FormData) {
  const required = formData.get("required") === "on";
  const max = Math.min(20, Math.max(1, Number(formData.get("max_select")) || 1));
  return { min_select: required ? 1 : 0, max_select: max };
}

export async function addModifierGroup(formData: FormData) {
  const { session, supabase } = await ownerContext();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await supabase.from("modifier_groups").insert({
    business_id: session.business.id,
    product_id: String(formData.get("product_id")),
    name,
    ...groupLimits(formData),
    sort_order: 99,
  });
  refresh();
}

export async function updateModifierGroup(formData: FormData) {
  const { supabase } = await ownerContext();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await supabase.from("modifier_groups").update({ name, ...groupLimits(formData) }).eq("id", String(formData.get("id")));
  refresh();
}

export async function deleteModifierGroup(formData: FormData) {
  const { supabase } = await ownerContext();
  await supabase.from("modifier_groups").delete().eq("id", String(formData.get("id")));
  refresh();
}

export async function addModifierOption(formData: FormData) {
  const { session, supabase } = await ownerContext();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await supabase.from("modifier_options").insert({
    business_id: session.business.id,
    group_id: String(formData.get("group_id")),
    name,
    price_delta: parsePesos(formData.get("price_delta")) ?? 0,
    sort_order: 99,
  });
  refresh();
}

export async function updateModifierOption(formData: FormData) {
  const { supabase } = await ownerContext();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await supabase
    .from("modifier_options")
    .update({ name, price_delta: parsePesos(formData.get("price_delta")) ?? 0, is_available: formData.get("is_available") === "on" })
    .eq("id", String(formData.get("id")));
  refresh();
}

export async function deleteModifierOption(formData: FormData) {
  const { supabase } = await ownerContext();
  await supabase.from("modifier_options").delete().eq("id", String(formData.get("id")));
  refresh();
}
