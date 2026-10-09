import { describe, expect, it } from "vitest";
import {
  assertCanChangeStatus,
  canTransition,
  getNextStatus,
  getTimelineIndex,
  isFinalStatus,
  ORDER_STATUSES,
  roleCanSetStatus,
  STATUS_LABELS,
  StatusTransitionError,
} from "@/lib/orders/status";

describe("transiciones de estado", () => {
  it("sigue el flujo Recibido → En preparación → Empacando → Listo → Entregado", () => {
    expect(getNextStatus("received")).toBe("preparing");
    expect(getNextStatus("preparing")).toBe("packing");
    expect(getNextStatus("packing")).toBe("ready");
    expect(getNextStatus("ready")).toBe("delivered");
    expect(getNextStatus("delivered")).toBeNull();
    expect(getNextStatus("cancelled")).toBeNull();
  });

  it("no permite saltar ni retroceder estados", () => {
    expect(canTransition("received", "ready")).toBe(false);
    expect(canTransition("received", "delivered")).toBe(false);
    expect(canTransition("ready", "preparing")).toBe(false);
    expect(canTransition("received", "received")).toBe(false);
  });

  it("permite cancelar antes de entregar", () => {
    for (const s of ["received", "preparing", "packing", "ready"] as const) {
      expect(canTransition(s, "cancelled")).toBe(true);
    }
  });

  it("Entregado y Cancelado son finales", () => {
    expect(isFinalStatus("delivered")).toBe(true);
    expect(isFinalStatus("cancelled")).toBe(true);
    for (const to of ORDER_STATUSES) {
      expect(canTransition("delivered", to)).toBe(false);
      expect(canTransition("cancelled", to)).toBe(false);
    }
  });

  it("tiene etiqueta en español para cada estado", () => {
    expect(STATUS_LABELS.ready).toBe("Listo para recoger");
    for (const s of ORDER_STATUSES) expect(STATUS_LABELS[s]).toBeTruthy();
  });

  it("ubica el estado en la línea de tiempo", () => {
    expect(getTimelineIndex("received")).toBe(0);
    expect(getTimelineIndex("delivered")).toBe(4);
    expect(getTimelineIndex("cancelled")).toBe(-1);
  });
});

describe("permisos por rol", () => {
  it("el dueño puede todo", () => {
    for (const s of ORDER_STATUSES) expect(roleCanSetStatus("owner", s)).toBe(true);
  });

  it("el chef prepara, empaca, marca listo o cancela, pero no entrega", () => {
    expect(roleCanSetStatus("chef", "preparing")).toBe(true);
    expect(roleCanSetStatus("chef", "packing")).toBe(true);
    expect(roleCanSetStatus("chef", "ready")).toBe(true);
    expect(roleCanSetStatus("chef", "cancelled")).toBe(true);
    expect(roleCanSetStatus("chef", "delivered")).toBe(false);
  });

  it("el mesero entrega o cancela", () => {
    expect(roleCanSetStatus("waiter", "delivered")).toBe(true);
    expect(roleCanSetStatus("waiter", "cancelled")).toBe(true);
    expect(roleCanSetStatus("waiter", "preparing")).toBe(false);
    expect(roleCanSetStatus("waiter", "ready")).toBe(false);
  });

  it("assertCanChangeStatus explica el error en español", () => {
    expect(() => assertCanChangeStatus("received", "ready")).toThrow(StatusTransitionError);
    expect(() => assertCanChangeStatus("received", "ready")).toThrow(/No se puede pasar de "Recibido"/);
    expect(() => assertCanChangeStatus("ready", "delivered", "chef")).toThrow(/chef/);
    expect(() => assertCanChangeStatus("ready", "delivered", "waiter")).not.toThrow();
  });
});
