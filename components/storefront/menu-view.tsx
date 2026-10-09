"use client";

import { useState, type ReactNode } from "react";
import { useCart } from "./cart-context";
import { ProductImage } from "./product-image";
import { ProductSheet } from "./product-sheet";
import { BizLink } from "./biz-button";
import { Badge } from "@/components/ui/badge";
import { IconPlus } from "@/components/ui/icons";
import { formatCOP } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export function MenuView({
  slug,
  categories,
  canOrder,
  footer,
}: {
  slug: string;
  categories: Category[];
  canOrder: boolean;
  footer?: ReactNode;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const cart = useCart();

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted">Este negocio aún no ha publicado su menú.</p>
        {footer}
      </div>
    );
  }

  return (
    <>
      <nav
        aria-label="Categorías del menú"
        className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <a
                href={`#cat-${c.id}`}
                className="inline-flex min-h-11 items-center rounded-full bg-mist px-4 text-sm font-semibold text-ink hover:bg-line"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-3xl px-4 pb-36 pt-2">
        {categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20 pt-6" aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`} className="mb-3 font-display text-2xl font-bold">
              {c.name}
            </h2>
            <ul className="divide-y divide-line">
              {c.products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    disabled={!p.is_available}
                    className="flex w-full items-start gap-4 py-4 text-left disabled:cursor-not-allowed"
                    aria-label={`${p.name}, ${formatCOP(p.price)}${p.is_available ? "" : ", agotado"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-display text-lg font-semibold leading-snug ${p.is_available ? "" : "text-muted"}`}>
                        {p.name}
                      </h3>
                      {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>}
                      <p className="mt-2 flex items-center gap-2 font-bold">
                        {formatCOP(p.price)}
                        {!p.is_available && <Badge tone="danger">Agotado</Badge>}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <ProductImage
                        src={p.image_url}
                        name={p.name}
                        className={`size-24 rounded-2xl sm:size-28 ${p.is_available ? "" : "opacity-50 grayscale"}`}
                      />
                      {p.is_available && canOrder && (
                        <span className="absolute -bottom-2 -right-2 grid size-11 place-items-center rounded-full border-4 border-white bg-[var(--biz)] text-[var(--biz-ink)]">
                          <IconPlus size={20} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {footer}
      </div>

      {selected && (
        <ProductSheet product={selected} canOrder={canOrder} onClose={() => setSelected(null)} />
      )}

      {cart.ready && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <BizLink href={`/${slug}/checkout`} className="w-full justify-between px-5 py-3 text-lg">
              <span className="rounded-lg bg-black/10 px-2.5 py-0.5 text-base">{cart.count}</span>
              <span>Ver mi pedido</span>
              <span>{formatCOP(cart.total)}</span>
            </BizLink>
          </div>
        </div>
      )}
    </>
  );
}
