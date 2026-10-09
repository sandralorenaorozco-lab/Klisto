import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPublicBusiness } from "@/lib/data/catalog";
import { BusinessHeader } from "@/components/storefront/business-header";
import { TrackingView } from "@/components/tracking/tracking-view";
import { SITE_URL } from "@/lib/env";
import type { TrackedOrder } from "@/lib/types";

export const metadata: Metadata = { title: "Seguimiento de tu pedido", robots: { index: false, follow: false } };

export default async function TrackingPage({ params, searchParams }: PageProps<"/[slug]/pedido/[token]">) {
  const { slug, token } = await params;
  const { nuevo } = await searchParams;

  const supabase = await getServerSupabase();
  const [business, { data }] = await Promise.all([
    getPublicBusiness(slug),
    supabase.rpc("get_order_by_token", { p_token: token }),
  ]);
  const order = data as TrackedOrder | null;
  if (!business || !order || order.business.slug !== business.slug) notFound();

  return (
    <>
      <BusinessHeader business={business} compact />
      <main className="flex-1">
        <TrackingView
          token={token}
          initialOrder={order}
          isNew={nuevo === "1"}
          trackingUrl={`${SITE_URL}/${business.slug}/pedido/${token}`}
        />
      </main>
    </>
  );
}
