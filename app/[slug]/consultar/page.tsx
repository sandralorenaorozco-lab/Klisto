import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBusiness } from "@/lib/data/catalog";
import { BusinessHeader } from "@/components/storefront/business-header";
import { LookupForm } from "@/components/tracking/lookup-form";

export const metadata: Metadata = { title: "Consultar mi pedido", robots: { index: false } };

export default async function LookupPage({ params }: PageProps<"/[slug]/consultar">) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  return (
    <>
      <BusinessHeader business={business} compact />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Consultar mi pedido</h1>
        <p className="mt-2 text-ink-soft">Escribe el código de tu pedido y el celular con el que lo hiciste.</p>
        <LookupForm slug={business.slug} />
      </main>
    </>
  );
}
