import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const inserted: Record<string, unknown>[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  getAdminSupabase: () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        inserted.push(row);
        return { error: null };
      },
    }),
  }),
}));

const { sendWhatsAppTemplate, isWhatsAppLive } = await import("@/lib/whatsapp");

const base = {
  businessId: "b1",
  orderId: "o1",
  toPhone: "300 123 4521",
  template: "order_ready" as const,
  params: ["Sofía", "SLO-4521-05", "Klisto Burger"],
};

describe("WhatsApp", () => {
  beforeEach(() => {
    inserted.length = 0;
    vi.unstubAllEnvs();
    vi.stubEnv("WHATSAPP_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sin credenciales funciona en modo simulado y registra el mensaje", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(isWhatsAppLive()).toBe(false);
    const result = await sendWhatsAppTemplate(base);

    expect(result).toEqual({ ok: true, mode: "simulated" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain("Sofía, tu pedido SLO-4521-05 ya está listo para recoger en Klisto Burger");
    expect(inserted[0]).toMatchObject({
      business_id: "b1",
      order_id: "o1",
      to_phone: "573001234521",
      template: "pedido_listo",
      mode: "simulated",
      status: "sent",
    });
  });

  it("con credenciales llama a la API oficial de Meta con la plantilla", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "token-de-prueba");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "12345");
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.X" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await sendWhatsAppTemplate(base);

    expect(result).toEqual({ ok: true, mode: "live", messageId: "wamid.X" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toMatch(/^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/12345\/messages$/);
    expect(init.headers.Authorization).toBe("Bearer token-de-prueba");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      messaging_product: "whatsapp",
      to: "573001234521",
      type: "template",
      template: { name: "pedido_listo", language: { code: "es_CO" } },
    });
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual(base.params);
    expect(inserted[0]).toMatchObject({ mode: "live", status: "sent", provider_message_id: "wamid.X" });
  });

  it("si Meta responde con error, no lanza excepción y registra el fallo", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "t");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Template not found" } }), { status: 400 })),
    );

    const result = await sendWhatsAppTemplate(base);
    expect(result).toEqual({ ok: false, mode: "live", error: "Template not found" });
    expect(inserted[0]).toMatchObject({ status: "failed", error: "Template not found" });
  });
});
