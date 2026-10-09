import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBusiness, getPublicCatalog } from "@/lib/data/catalog";
import { BusinessHeader } from "@/components/storefront/business-header";
import { MenuView } from "@/components/storefront/menu-view";
import { Notice } from "@/components/ui/notice";
import { isOpenNow } from "@/lib/hours";
import { PoweredBy } from "@/components/storefront/powered-by";

export default async function StorefrontPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  if (business.business_type === "services") {
    return (
      <>
        <BusinessHeader business={business} />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Muy pronto podrás reservar tu cita aquí</h1>
          <p className="mt-3 text-ink-soft">Mientras tanto, comunícate directamente con {business.name}.</p>
          <PoweredBy />
        </main>
      </>
    );
  }

  const categories = await getPublicCatalog(business.id);
  const open = isOpenNow(business.opening_hours, business.timezone);
  const canOrder = open && business.accepting_orders;

  return (
    <>
      <BusinessHeader business={business} />
      <main className="flex-1">
        {!canOrder && (
          <div className="mx-auto max-w-3xl px-4 pt-4">
            <Notice tone="info">
              {!business.accepting_orders
                ? "En este momento no estamos recibiendo pedidos en línea. Puedes ver el menú."
                : "Estamos cerrados. Puedes ver el menú y pedir cuando abramos."}
            </Notice>
          </div>
        )}
        <MenuView
          slug={business.slug}
          categories={categories}
          canOrder={canOrder}
          footer={
            <div className="flex flex-col items-center pt-10 text-center">
              <Link href={`/${business.slug}/consultar`} className="inline-flex min-h-11 items-center text-sm font-semibold underline">
                ¿Ya hiciste un pedido? Consúltalo aquí
              </Link>
              <PoweredBy />
            </div>
          }
        />
      </main>
    </>
  );
}
