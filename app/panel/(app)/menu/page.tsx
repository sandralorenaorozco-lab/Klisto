import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/data/catalog";
import { PageShell, Card } from "@/components/panel/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/storefront/product-image";
import { CategoryCreateForm } from "@/components/panel/menu-forms";
import { IconArrowRight, IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";
import { formatCOP } from "@/lib/format";
import { deleteCategory, moveCategory, toggleProductAvailability, updateCategory } from "./actions";

export const metadata: Metadata = { title: "Menú" };

export default async function MenuAdminPage() {
  const { business } = await requirePanel(["owner"]);
  const supabase = await getServerSupabase();
  const categories = await loadCatalog(supabase, business.id, { includeInactive: true });

  return (
    <PageShell
      title="Menú"
      description="Organiza tus categorías y productos. Marca como agotado lo que no tengas hoy."
      actions={
        categories.length > 0 && (
          <ButtonLink href="/panel/menu/nuevo" size="lg">
            <IconPlus size={20} /> Nuevo producto
          </ButtonLink>
        )
      }
    >
      <div style={{ "--biz": business.primary_color } as React.CSSProperties} className="space-y-6">
        <Card>
          <h2 className="font-display text-xl font-bold">Categorías</h2>
          {categories.length === 0 && <p className="mt-1 text-muted">Crea tu primera categoría, por ejemplo “Hamburguesas” o “Bebidas”.</p>}
          <ul className="mt-4 divide-y divide-line">
            {categories.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                <form key={`${c.name}-${c.is_active}`} action={updateCategory} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="sr-only" htmlFor={`cat-${c.id}`}>
                    Nombre de la categoría
                  </label>
                  <input
                    id={`cat-${c.id}`}
                    name="name"
                    defaultValue={c.name}
                    className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-line px-3 focus:border-brand focus:outline-none"
                  />
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={c.is_active} className="size-5 accent-[#FF6A2B]" />
                    Visible
                  </label>
                  <button type="submit" className="min-h-11 rounded-lg bg-mist px-3 text-sm font-semibold">
                    Guardar
                  </button>
                </form>
                <form action={moveCategory} className="flex">
                  <input type="hidden" name="id" value={c.id} />
                  <button name="dir" value="up" disabled={i === 0} className="grid size-11 place-items-center rounded-lg disabled:opacity-30" aria-label={`Subir ${c.name}`}>
                    ↑
                  </button>
                  <button
                    name="dir"
                    value="down"
                    disabled={i === categories.length - 1}
                    className="grid size-11 place-items-center rounded-lg disabled:opacity-30"
                    aria-label={`Bajar ${c.name}`}
                  >
                    ↓
                  </button>
                </form>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    disabled={c.products.length > 0}
                    title={c.products.length > 0 ? "Solo puedes borrar categorías vacías" : "Borrar categoría"}
                    className="grid size-11 place-items-center rounded-lg text-danger disabled:text-line"
                    aria-label={`Borrar ${c.name}`}
                  >
                    <IconTrash size={20} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <CategoryCreateForm />
        </Card>

        {categories.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold">
                {c.name} {!c.is_active && <Badge>Oculta</Badge>}
              </h2>
              <Link href={`/panel/menu/nuevo?categoria=${c.id}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline">
                <IconPlus size={16} /> Agregar producto
              </Link>
            </div>
            {c.products.length === 0 ? (
              <p className="mt-2 text-muted">Sin productos.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {c.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <ProductImage src={p.image_url} name={p.name} className="size-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-sm text-muted">
                        {formatCOP(p.price)}
                        {p.modifier_groups.length > 0 && ` · ${p.modifier_groups.length} grupo(s) de opciones`}
                      </p>
                    </div>
                    <form action={toggleProductAvailability}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="available" value={String(!p.is_available)} />
                      <button
                        type="submit"
                        className={`min-h-11 rounded-full px-4 text-sm font-bold ${p.is_available ? "bg-ready text-ready-ink" : "bg-danger-soft text-danger"}`}
                        aria-label={`${p.name}: ${p.is_available ? "disponible, marcar agotado" : "agotado, marcar disponible"}`}
                      >
                        {p.is_available ? "Disponible" : "Agotado"}
                      </button>
                    </form>
                    <Link href={`/panel/menu/${p.id}`} className="grid size-11 place-items-center rounded-lg hover:bg-mist" aria-label={`Editar ${p.name}`}>
                      <IconEdit size={20} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}

        <p className="text-sm text-muted">
          <Link href={`/${business.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 font-semibold underline">
            Ver cómo lo ven tus clientes <IconArrowRight size={16} />
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
