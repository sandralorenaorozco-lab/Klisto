import { describe, expect, it } from "vitest";
import { OrderValidationError, priceItem, sumTotal } from "@/lib/orders/pricing";
import type { Product } from "@/lib/types";

const burger: Product = {
  id: "p1",
  category_id: "c1",
  name: "Hamburguesa clásica",
  description: null,
  price: 18000,
  image_url: null,
  is_available: true,
  sort_order: 0,
  modifier_groups: [
    {
      id: "g1", product_id: "p1", name: "Término", min_select: 1, max_select: 1, sort_order: 0,
      options: [
        { id: "o1", group_id: "g1", name: "Medio", price_delta: 0, is_available: true, sort_order: 0 },
        { id: "o2", group_id: "g1", name: "Bien asado", price_delta: 0, is_available: true, sort_order: 1 },
      ],
    },
    {
      id: "g2", product_id: "p1", name: "Adiciones", min_select: 0, max_select: 3, sort_order: 1,
      options: [
        { id: "o3", group_id: "g2", name: "Tocineta", price_delta: 4000, is_available: true, sort_order: 0 },
        { id: "o4", group_id: "g2", name: "Queso extra", price_delta: 3000, is_available: false, sort_order: 1 },
      ],
    },
  ],
};

describe("priceItem", () => {
  it("suma adiciones y multiplica por cantidad", () => {
    const item = priceItem(burger, { productId: "p1", quantity: 2, optionIds: ["o1", "o3"], notes: " sin cebolla " });
    expect(item.unitPrice).toBe(22000);
    expect(item.lineTotal).toBe(44000);
    expect(item.notes).toBe("sin cebolla");
    expect(item.modifiers).toEqual([
      { group: "Término", option: "Medio", price_delta: 0 },
      { group: "Adiciones", option: "Tocineta", price_delta: 4000 },
    ]);
    expect(sumTotal([item, item])).toBe(88000);
  });

  it("exige los grupos obligatorios", () => {
    expect(() => priceItem(burger, { productId: "p1", quantity: 1, optionIds: [] })).toThrow(/Término/);
  });

  it("respeta el máximo de opciones", () => {
    expect(() => priceItem(burger, { productId: "p1", quantity: 1, optionIds: ["o1", "o2"] })).toThrow(
      OrderValidationError,
    );
  });

  it("rechaza opciones agotadas, ajenas o productos agotados", () => {
    expect(() => priceItem(burger, { productId: "p1", quantity: 1, optionIds: ["o1", "o4"] })).toThrow(/agotado/);
    expect(() => priceItem(burger, { productId: "p1", quantity: 1, optionIds: ["o1", "zz"] })).toThrow();
    expect(() =>
      priceItem({ ...burger, is_available: false }, { productId: "p1", quantity: 1, optionIds: ["o1"] }),
    ).toThrow(/agotado/);
  });

  it("valida la cantidad", () => {
    expect(() => priceItem(burger, { productId: "p1", quantity: 0, optionIds: ["o1"] })).toThrow();
    expect(() => priceItem(burger, { productId: "p1", quantity: 100, optionIds: ["o1"] })).toThrow();
  });
});
