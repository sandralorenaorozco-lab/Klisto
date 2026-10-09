import { describe, expect, it } from "vitest";
import { formatCOP, formatPhone, toWhatsAppNumber } from "@/lib/format";
import { isValidColombianMobile, normalizeColombianMobile } from "@/lib/validation";
import { isOpenNow } from "@/lib/hours";
import { readableTextColor } from "@/lib/color";

describe("formatCOP", () => {
  it("usa punto de miles y signo pesos", () => {
    expect(formatCOP(12500)).toBe("$12.500");
    expect(formatCOP(5000)).toBe("$5.000");
    expect(formatCOP(1250000)).toBe("$1.250.000");
    expect(formatCOP(0)).toBe("$0");
  });
});

describe("celular colombiano", () => {
  it("valida 10 dígitos que empiezan por 3", () => {
    expect(isValidColombianMobile("3001234521")).toBe(true);
    expect(isValidColombianMobile("300 123 4521")).toBe(true);
    expect(isValidColombianMobile("+57 300 123 4521")).toBe(true);
    expect(isValidColombianMobile("6011234567")).toBe(false);
    expect(isValidColombianMobile("300123452")).toBe(false);
    expect(isValidColombianMobile("30012345211")).toBe(false);
  });

  it("normaliza y formatea", () => {
    expect(normalizeColombianMobile("+57 300-123-4521")).toBe("3001234521");
    expect(formatPhone("3001234521")).toBe("300 123 4521");
    expect(toWhatsAppNumber("3001234521")).toBe("573001234521");
  });
});

describe("isOpenNow (America/Bogota, UTC-5)", () => {
  const hours = { mon: { open: "08:00", close: "20:00" }, fri: { open: "18:00", close: "02:00" }, sun: { open: "08:00", close: "12:00", closed: true } };

  it("sin horario configurado se considera abierto", () => {
    expect(isOpenNow({})).toBe(true);
  });

  it("evalúa la hora local de Bogotá", () => {
    // Lunes 2026-10-05 13:00 UTC = 08:00 Bogotá
    expect(isOpenNow(hours, "America/Bogota", new Date("2026-10-05T13:00:00Z"))).toBe(true);
    // Lunes 2026-10-05 12:59 UTC = 07:59 Bogotá
    expect(isOpenNow(hours, "America/Bogota", new Date("2026-10-05T12:59:00Z"))).toBe(false);
  });

  it("soporta horarios después de medianoche y días cerrados", () => {
    // Sábado 2026-10-10 01:00 Bogotá (06:00 UTC) sigue el horario del viernes
    expect(isOpenNow(hours, "America/Bogota", new Date("2026-10-10T06:00:00Z"))).toBe(true);
    // Domingo 10:00 Bogotá, marcado cerrado
    expect(isOpenNow(hours, "America/Bogota", new Date("2026-10-11T15:00:00Z"))).toBe(false);
  });
});

describe("readableTextColor", () => {
  it("usa texto oscuro sobre el naranja de Klisto y blanco sobre oscuro", () => {
    expect(readableTextColor("#FF6A2B")).toBe("#15171C");
    expect(readableTextColor("#15171C")).toBe("#FFFFFF");
  });
});
