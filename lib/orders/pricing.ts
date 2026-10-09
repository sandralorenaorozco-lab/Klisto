import type { ModifierGroup, OrderItemModifier, Product } from "@/lib/types";

export class OrderValidationError extends Error {}

export type ItemSelection = {
  productId: string;
  quantity: number;
  optionIds: string[];
  notes?: string;
};

export type PricedItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: OrderItemModifier[];
  notes: string | null;
};

/** Revisa si una selección de opciones cumple los mínimos y máximos del grupo. */
export function validateGroupSelection(group: ModifierGroup, selectedIds: string[]): string | null {
  const chosen = group.options.filter((o) => selectedIds.includes(o.id));
  if (chosen.length < group.min_select) {
    return group.min_select === 1
      ? `Elige una opción en "${group.name}".`
      : `Elige al menos ${group.min_select} opciones en "${group.name}".`;
  }
  if (chosen.length > group.max_select) {
    return group.max_select === 1
      ? `Solo puedes elegir una opción en "${group.name}".`
      : `Puedes elegir máximo ${group.max_select} opciones en "${group.name}".`;
  }
  return null;
}

/**
 * Calcula el precio de una línea del pedido a partir del catálogo.
 * Se usa en el navegador (para mostrar) y en el servidor (para cobrar):
 * el servidor NUNCA confía en precios enviados por el navegador.
 */
export function priceItem(product: Product, selection: ItemSelection): PricedItem {
  if (!product.is_available) {
    throw new OrderValidationError(`"${product.name}" está agotado.`);
  }
  if (!Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 99) {
    throw new OrderValidationError("La cantidad debe estar entre 1 y 99.");
  }

  const groupOptionIds = new Set(product.modifier_groups.flatMap((g) => g.options.map((o) => o.id)));
  const unknown = selection.optionIds.filter((id) => !groupOptionIds.has(id));
  if (unknown.length > 0) {
    throw new OrderValidationError(`Una de las opciones elegidas no pertenece a "${product.name}".`);
  }
  if (new Set(selection.optionIds).size !== selection.optionIds.length) {
    throw new OrderValidationError("Hay opciones repetidas.");
  }

  const modifiers: OrderItemModifier[] = [];
  let unitPrice = product.price;

  for (const group of [...product.modifier_groups].sort((a, b) => a.sort_order - b.sort_order)) {
    const error = validateGroupSelection(group, selection.optionIds);
    if (error) throw new OrderValidationError(error);

    for (const option of group.options) {
      if (!selection.optionIds.includes(option.id)) continue;
      if (!option.is_available) {
        throw new OrderValidationError(`"${option.name}" está agotado.`);
      }
      unitPrice += option.price_delta;
      modifiers.push({ group: group.name, option: option.name, price_delta: option.price_delta });
    }
  }

  const notes = selection.notes?.trim() ? selection.notes.trim().slice(0, 200) : null;

  return {
    productId: product.id,
    productName: product.name,
    quantity: selection.quantity,
    unitPrice,
    lineTotal: unitPrice * selection.quantity,
    modifiers,
    notes,
  };
}

export function sumTotal(items: Pick<PricedItem, "lineTotal">[]): number {
  return items.reduce((acc, item) => acc + item.lineTotal, 0);
}
