/**
 * Interfaz común de métodos de pago. Hoy solo existe "Pagar al recoger".
 * Para integrar Wompi (Nequi, PSE, tarjetas) basta con implementar esta
 * interfaz en lib/payments/wompi.ts y registrarla en lib/payments/index.ts.
 */
export type PaymentMethodId = "pay_at_pickup" | "wompi";

export type PaymentIntent = {
  orderId: string;
  orderCode: string;
  amount: number; // pesos colombianos
  customerName: string;
  customerPhone: string;
  returnUrl: string; // a dónde vuelve el cliente después de pagar
};

export type PaymentStart =
  | { kind: "none" } // no hay que hacer nada ahora (se paga en el local)
  | { kind: "redirect"; url: string; reference: string }; // ir a la pasarela

export type WebhookResult = {
  orderId: string;
  reference: string;
  status: "paid" | "failed" | "pending";
};

export interface PaymentProvider {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
  startPayment(intent: PaymentIntent): Promise<PaymentStart>;
  /** Valida la firma del evento de la pasarela y devuelve el nuevo estado. */
  handleWebhook?(request: Request): Promise<WebhookResult | null>;
}
