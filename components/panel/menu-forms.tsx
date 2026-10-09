"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCategory, saveProduct } from "@/app/panel/(app)/menu/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { ActionState } from "@/lib/panel";
import type { Product } from "@/lib/types";

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCategory, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
      <Field label="Nueva categoría" htmlFor="new-category" error={state.errors?.name} className="min-w-48 flex-1">
        <Input id="new-category" name="name" placeholder="Ej.: Bebidas" maxLength={60} />
      </Field>
      <Button type="submit" size="lg" variant="dark" disabled={pending}>
        Agregar
      </Button>
    </form>
  );
}

export function ProductForm({
  product,
  categories,
  defaultCategoryId,
}: {
  product?: Omit<Product, "modifier_groups">;
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProduct, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <Field label="Nombre" htmlFor="name" error={e.name}>
        <Input id="name" name="name" defaultValue={product?.name} required maxLength={80} />
      </Field>
      <Field label="Descripción" htmlFor="description" hint="Ingredientes o detalles que ayuden a decidir.">
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} maxLength={400} rows={3} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Precio (pesos)" htmlFor="price" error={e.price} hint="Sin puntos ni signo, ej.: 22900">
          <Input id="price" name="price" inputMode="numeric" defaultValue={product?.price ?? ""} required />
        </Field>
        <Field label="Categoría" htmlFor="category_id" error={e.category_id}>
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? defaultCategoryId ?? categories[0]?.id}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Foto" htmlFor="image" hint="JPG, PNG o WebP de máximo 5 MB. Mejor si es cuadrada.">
        <div className="flex items-center gap-3">
          {product?.image_url && <img src={product.image_url} alt="Foto actual" className="size-16 shrink-0 rounded-xl object-cover" />}
          <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="py-2" />
        </div>
      </Field>
      {product?.image_url && <Checkbox id="remove_image" name="remove_image" label="Quitar la foto actual" />}
      <Checkbox id="is_available" name="is_available" defaultChecked={product?.is_available ?? true} label="Disponible (desmárcalo si está agotado)" />
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
