import { payAtPickup } from "./pay-at-pickup";
import { wompi } from "./wompi";
import type { PaymentMethodId, PaymentProvider } from "./types";

export const PAYMENT_PROVIDERS: Record<PaymentMethodId, PaymentProvider> = {
  pay_at_pickup: payAtPickup,
  wompi,
};

export function getEnabledPaymentMethods(): PaymentProvider[] {
  return Object.values(PAYMENT_PROVIDERS).filter((p) => p.enabled);
}

export type { PaymentProvider, PaymentMethodId } from "./types";
