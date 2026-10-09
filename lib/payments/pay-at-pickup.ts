import type { PaymentProvider } from "./types";

export const payAtPickup: PaymentProvider = {
  id: "pay_at_pickup",
  label: "Pagar al recoger",
  description: "Pagas en el local cuando recojas tu pedido.",
  enabled: true,
  async startPayment() {
    return { kind: "none" };
  },
};
