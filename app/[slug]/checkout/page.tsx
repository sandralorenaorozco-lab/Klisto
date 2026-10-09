import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBusiness } from "@/lib/data/catalog";
import { BusinessHeader } from "@/components/storefront/business-header";
import { CheckoutView } from "@/components/storefront/checkout-view";
import { getEnabledPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

export default async function CheckoutPage({ params }: PageProps<"/[slug]/checkout">) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  const methods = getEnabledPaymentMethods().map((m) => ({ id: m.id, label: m.label, description: m.description }));

  return (
    <>
      <BusinessHeader business={business} compact />
      <main className="flex-1">
        <CheckoutView slug={business.slug} businessName={business.name} paymentMethods={methods} />
      </main>
    </>
  );
}
