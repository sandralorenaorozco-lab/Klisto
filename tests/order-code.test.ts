import { describe, expect, it } from "vitest";
import {
  buildOrderCode,
  formatDailyNumber,
  getInitials,
  getPhoneSuffix,
  normalizeOrderCode,
  ORDER_CODE_PATTERN,
} from "@/lib/orders/code";

describe("buildOrderCode", () => {
  it("genera el ejemplo de la especificación", () => {
    expect(buildOrderCode({ customerName: "Sofía López Ortiz", phone: "3001234521", dailyNumber: 5 })).toBe(
      "SLO-4521-05",
    );
  });

  it("cumple el patrón esperado", () => {
    const code = buildOrderCode({ customerName: "Juan", phone: "3101112233", dailyNumber: 1 });
    expect(code).toBe("J-2233-01");
    expect(code).toMatch(ORDER_CODE_PATTERN);
  });

  it("acepta celulares con espacios o +57", () => {
    expect(buildOrderCode({ customerName: "Ana Pérez", phone: "+57 300 123 4521", dailyNumber: 12 })).toBe(
      "AP-4521-12",
    );
  });
});

describe("getInitials", () => {
  it("quita tildes y la eñe", () => {
    expect(getInitials("Ángela Úrsula Ñáñez")).toBe("AUN");
    expect(getInitials("élmer")).toBe("E");
  });

  it("usa máximo 3 palabras", () => {
    expect(getInitials("María José Gómez Restrepo")).toBe("MJG");
  });

  it("ignora espacios extra y separadores", () => {
    expect(getInitials("  luis   carlos  ")).toBe("LC");
    expect(getInitials("Ana-María O'Neil")).toBe("AMO");
  });

  it("falla si no hay letras", () => {
    expect(() => getInitials("123 !!")).toThrow();
  });
});

describe("partes del código", () => {
  it("toma los últimos 4 dígitos", () => {
    expect(getPhoneSuffix("3001234521")).toBe("4521");
    expect(() => getPhoneSuffix("12")).toThrow();
  });

  it("rellena el consecutivo a 2 dígitos sin cortarlo", () => {
    expect(formatDailyNumber(1)).toBe("01");
    expect(formatDailyNumber(9)).toBe("09");
    expect(formatDailyNumber(10)).toBe("10");
    expect(formatDailyNumber(100)).toBe("100");
    expect(() => formatDailyNumber(0)).toThrow();
    expect(() => formatDailyNumber(2.5)).toThrow();
  });

  it("normaliza el código que escribe el cliente", () => {
    expect(normalizeOrderCode(" slo-4521-05 ")).toBe("SLO-4521-05");
  });
});
