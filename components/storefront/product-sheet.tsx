"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "./cart-context";
import { ProductImage } from "./product-image";
import { BizButton } from "./biz-button";
import { IconMinus, IconPlus, IconX } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/format";
import { priceItem, validateGroupSelection, OrderValidationError } from "@/lib/orders/pricing";
import type { ModifierGroup, Product } from "@/lib/types";

/** Ventana para elegir modificadores, cantidad y notas de un producto. */
export function ProductSheet({ product, canOrder, onClose }: { product: Product; canOrder: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cart = useCart();
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No se cierra en la limpieza: al desmontarse, el <dialog> sale del DOM solo.
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const preview = useMemo(() => {
    try {
      return priceItem(product, { productId: product.id, quantity, optionIds, notes });
    } catch {
      return null;
    }
  }, [product, quantity, optionIds, notes]);

  const unitEstimate =
    product.price +
    product.modifier_groups
      .flatMap((g) => g.options)
      .filter((o) => optionIds.includes(o.id))
      .reduce((a, o) => a + o.price_delta, 0);

  function toggle(group: ModifierGroup, optionId: string) {
    setError(null);
    setOptionIds((prev) => {
      const groupIds = group.options.map((o) => o.id);
      if (group.max_select === 1) {
        return [...prev.filter((id) => !groupIds.includes(id)), optionId];
      }
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      const inGroup = prev.filter((id) => groupIds.includes(id));
      if (inGroup.length >= group.max_select) return prev;
      return [...prev, optionId];
    });
  }

  function handleAdd() {
    try {
      const priced = priceItem(product, { productId: product.id, quantity, optionIds, notes });
      cart.add({
        productId: product.id,
        name: product.name,
        quantity,
        optionIds,
        modifiers: priced.modifiers,
        notes: priced.notes ?? undefined,
        unitPrice: priced.unitPrice,
      });
      onClose();
    } catch (e) {
      setError(e instanceof OrderValidationError ? e.message : "No se pudo agregar el producto.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-white p-0 text-ink backdrop:bg-ink/60 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="relative shrink-0">
          <ProductImage src={product.image_url} name={product.name} className="h-44 w-full sm:h-56" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white text-ink shadow"
          >
            <IconX />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <h2 id="sheet-title" className="font-display text-2xl font-bold">
              {product.name}
            </h2>
            {product.description && <p className="mt-1 text-muted">{product.description}</p>}
            <p className="mt-2 text-lg font-bold">{formatCOP(product.price)}</p>
          </div>

          {product.modifier_groups.map((group) => {
            const groupError = validateGroupSelection(group, optionIds);
            const required = group.min_select > 0;
            const multi = group.max_select > 1;
            return (
              <fieldset key={group.id}>
                <legend className="mb-2 flex w-full items-center justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{group.name}</span>
                  <Badge tone={required ? (groupError ? "brand" : "ready") : "neutral"}>
                    {required ? "Obligatorio" : multi ? `Hasta ${group.max_select}` : "Opcional"}
                  </Badge>
                </legend>
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {group.options.map((o) => {
                    const checked = optionIds.includes(o.id);
                    return (
                      <li key={o.id}>
                        <label
                          className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 ${o.is_available ? "" : "cursor-not-allowed opacity-50"}`}
                        >
                          <input
                            type={multi ? "checkbox" : "radio"}
                            name={`g-${group.id}`}
                            checked={checked}
                            disabled={!o.is_available}
                            onChange={() => toggle(group, o.id)}
                            className="size-5 accent-[var(--biz)]"
                          />
                          <span className="flex-1">
                            {o.name}
                            {!o.is_available && " (agotado)"}
                          </span>
                          {o.price_delta > 0 && <span className="text-sm font-semibold text-muted">+{formatCOP(o.price_delta)}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}

          <div>
            <label htmlFor="item-notes" className="mb-2 block font-display text-lg font-semibold">
              Notas para la cocina
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Ej.: sin cebolla, salsas aparte"
              className="block w-full rounded-xl border-2 border-line px-4 py-3 text-base focus:border-[var(--biz)] focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-line px-5 py-4">
          <div className="flex items-center rounded-xl border-2 border-line" role="group" aria-label="Cantidad">
            <button
              type="button"
              className="grid size-12 place-items-center disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Quitar uno"
            >
              <IconMinus />
            </button>
            <span className="w-8 text-center text-lg font-bold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="grid size-12 place-items-center disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              disabled={quantity >= 99}
              aria-label="Agregar uno"
            >
              <IconPlus />
            </button>
          </div>
          <BizButton type="button" onClick={handleAdd} disabled={!canOrder || !product.is_available} className="flex-1 justify-between">
            <span>{canOrder ? "Agregar" : "No disponible"}</span>
            <span>{formatCOP((preview?.unitPrice ?? unitEstimate) * quantity)}</span>
          </BizButton>
        </div>
      </div>
    </dialog>
  );
}

