import type { PaymentProvider } from "./types";

/**
 * Esqueleto para Wompi (Bancolombia): acepta Nequi, PSE y tarjetas.
 * Aún NO está activo. Pasos para activarlo:
 *  1. Crear la cuenta en https://comercios.wompi.co y obtener las llaves
 *     (WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_SECRET, WOMPI_EVENTS_SECRET).
 *  2. En startPayment: generar la firma de integridad
 *     sha256(reference + amountInCents + "COP" + integritySecret) y devolver
 *     la URL del Web Checkout (https://checkout.wompi.co/p/?public-key=...&currency=COP
 *     &amount-in-cents=...&reference=...&signature:integrity=...&redirect-url=...).
 *  3. Crear app/api/payments/wompi/route.ts que llame a handleWebhook, verifique
 *     el checksum del evento con WOMPI_EVENTS_SECRET y actualice orders.payment_status.
 *  4. Cambiar enabled a true y agregar "wompi" en checkoutSchema (lib/validation.ts).
 */
export const wompi: PaymentProvider = {
  id: "wompi",
  label: "Pagar en línea (Nequi, PSE, tarjeta)",
  description: "Próximamente.",
  enabled: false,
  async startPayment() {
    throw new Error("Wompi todavía no está configurado.");
  },
};
