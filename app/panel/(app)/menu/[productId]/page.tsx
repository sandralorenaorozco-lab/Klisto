import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/data/catalog";
import { PageShell, Card } from "@/components/panel/page-shell";
import { ProductForm } from "@/components/panel/menu-forms";
import { Notice } from "@/components/ui/notice";
import { IconArrowLeft, IconTrash } from "@/components/ui/icons";
import { formatCOP } from "@/lib/format";
import {
  addModifierGroup,
  addModifierOption,
  deleteModifierGroup,
  deleteModifierOption,
  deleteProduct,
  updateModifierGroup,
  updateModifierOption,
} from "../actions";

export const metadata: Metadata = { title: "Editar producto" };

const smallInput = "min-h-11 rounded-lg border-2 border-line px-3 focus:border-brand focus:outline-none";
const smallButton = "min-h-11 rounded-lg px-3 text-sm font-semibold";

export default async function EditProductPage({ params, searchParams }: PageProps<"/panel/menu/[productId]">) {
  const { business } = await requirePanel(["owner"]);
  const { productId } = await params;
  const { creado } = await searchParams;
  const supabase = await getServerSupabase();
  const catalog = await loadCatalog(supabase, business.id, { includeInactive: true });
  const product = catalog.flatMap((c) => c.products).find((p) => p.id === productId);
  if (!product) notFound();

  return (
    <PageShell title={product.name}>
      <Link href="/panel/menu" className="-mt-4 mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold">
        <IconArrowLeft size={18} /> Volver al menú
      </Link>
      {creado && (
        <div className="mb-4">
          <Notice tone="success">Producto creado. Ahora puedes agregarle opciones.</Notice>
        </div>
      )}
      <div className="space-y-6">
        <Card>
          <ProductForm product={product} categories={catalog.map((c) => ({ id: c.id, name: c.name }))} />
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">Opciones y adiciones</h2>
          <p className="mt-1 text-sm text-muted">
            Ejemplos: “Término de la carne” (obligatorio, elige 1) o “Adiciones” (opcional, hasta 4) con su precio extra.
          </p>

          <div className="mt-4 space-y-4">
            {product.modifier_groups.map((g) => (
              <div key={g.id} className="rounded-2xl border border-line p-4">
                <form action={updateModifierGroup} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={g.id} />
                  <label className="flex min-w-40 flex-1 flex-col text-sm font-semibold">
                    Nombre del grupo
                    <input name="name" defaultValue={g.name} className={`${smallInput} mt-1 font-normal`} />
                  </label>
                  <label className="flex flex-col text-sm font-semibold">
                    Máximo a elegir
                    <input name="max_select" type="number" min={1} max={20} defaultValue={g.max_select} className={`${smallInput} mt-1 w-24 font-normal`} />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" name="required" defaultChecked={g.min_select > 0} className="size-5 accent-[#FF6A2B]" />
                    Obligatorio
                  </label>
                  <button type="submit" className={`${smallButton} bg-mist`}>
                    Guardar
                  </button>
                  <button formAction={deleteModifierGroup} className={`${smallButton} text-danger`} aria-label={`Borrar grupo ${g.name}`}>
                    <IconTrash size={18} />
                  </button>
                </form>

                <ul className="mt-3 space-y-2">
                  {g.options.map((o) => (
                    <li key={o.id}>
                      <form action={updateModifierOption} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={o.id} />
                        <label className="sr-only" htmlFor={`on-${o.id}`}>
                          Nombre de la opción
                        </label>
                        <input id={`on-${o.id}`} name="name" defaultValue={o.name} className={`${smallInput} min-w-32 flex-1`} />
                        <label className="sr-only" htmlFor={`op-${o.id}`}>
                          Precio extra
                        </label>
                        <input id={`op-${o.id}`} name="price_delta" inputMode="numeric" defaultValue={o.price_delta} className={`${smallInput} w-28`} />
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input type="checkbox" name="is_available" defaultChecked={o.is_available} className="size-5 accent-[#FF6A2B]" />
                          Disponible
                        </label>
                        <button type="submit" className={`${smallButton} bg-mist`}>
                          Guardar
                        </button>
                        <button formAction={deleteModifierOption} className={`${smallButton} text-danger`} aria-label={`Borrar opción ${o.name}`}>
                          <IconTrash size={18} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>

                <form action={addModifierOption} className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <input type="hidden" name="group_id" value={g.id} />
                  <label className="sr-only" htmlFor={`new-o-${g.id}`}>
                    Nueva opción
                  </label>
                  <input id={`new-o-${g.id}`} name="name" placeholder="Nueva opción" className={`${smallInput} min-w-32 flex-1`} />
                  <label className="sr-only" htmlFor={`new-p-${g.id}`}>
                    Precio extra de la nueva opción
                  </label>
                  <input id={`new-p-${g.id}`} name="price_delta" inputMode="numeric" placeholder="Precio extra (0)" className={`${smallInput} w-36`} />
                  <button type="submit" className={`${smallButton} bg-ink text-white`}>
                    Agregar opción
                  </button>
                </form>
              </div>
            ))}
          </div>

          <form action={addModifierGroup} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-mist p-4">
            <input type="hidden" name="product_id" value={product.id} />
            <label className="flex min-w-40 flex-1 flex-col text-sm font-semibold">
              Nuevo grupo de opciones
              <input name="name" placeholder="Ej.: Tamaño" className={`${smallInput} mt-1 bg-white font-normal`} />
            </label>
            <label className="flex flex-col text-sm font-semibold">
              Máximo a elegir
              <input name="max_select" type="number" min={1} max={20} defaultValue={1} className={`${smallInput} mt-1 w-24 bg-white font-normal`} />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="required" className="size-5 accent-[#FF6A2B]" />
              Obligatorio
            </label>
            <button type="submit" className={`${smallButton} bg-ink text-white`}>
              Crear grupo
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold">Borrar producto</h2>
          <p className="mt-1 text-sm text-muted">
            Los pedidos anteriores conservan el nombre y el precio ({formatCOP(product.price)}). Si solo no lo tienes hoy, márcalo como agotado.
          </p>
          <form action={deleteProduct} className="mt-3">
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="min-h-11 rounded-xl bg-danger-soft px-4 font-semibold text-danger">
              Borrar “{product.name}”
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
