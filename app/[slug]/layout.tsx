import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getPublicBusiness } from "@/lib/data/catalog";
import { readableTextColor } from "@/lib/color";
import { CartProvider } from "@/components/storefront/cart-context";
import { PoweredBy } from "@/components/storefront/powered-by";
import { isSupabaseConfigured } from "@/lib/env";

export async function generateMetadata({ params }: LayoutProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured()) return {};
  const business = await getPublicBusiness(slug);
  if (!business) return { title: "Negocio no encontrado" };
  return {
    title: { absolute: `${business.name} · Pide en línea` },
    description: `Haz tu pedido en ${business.name} desde el celular y recógelo sin filas.`,
    manifest: `/${business.slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: business.name },
    robots: business.available ? undefined : { index: false },
  };
}

export default async function BusinessLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    return <SetupNeeded />;
  }
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  const style = {
    "--biz": business.primary_color,
    "--biz-ink": readableTextColor(business.primary_color),
  } as CSSProperties;

  if (!business.available) {
    return (
      <main style={style} className="flex flex-1 flex-col items-center justify-center bg-mist px-6 py-20 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-[var(--biz)] font-display text-2xl font-bold text-[var(--biz-ink)]">
          {business.name.slice(0, 1)}
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold">{business.name}</h1>
        <p className="mt-3 max-w-sm text-lg text-ink-soft">
          Esta página está temporalmente no disponible. Vuelve a intentarlo más tarde.
        </p>
        <PoweredBy />
      </main>
    );
  }

  return (
    <div style={style} className="flex flex-1 flex-col bg-white">
      <CartProvider slug={business.slug}>{children}</CartProvider>
    </div>
  );
}

function SetupNeeded() {
  return (
    <main className="mx-auto max-w-lg flex-1 px-6 py-20">
      <h1 className="font-display text-3xl font-bold">Falta configurar Supabase</h1>
      <p className="mt-4 text-ink-soft">
        Crea el archivo <code className="rounded bg-mist px-1.5">.env.local</code> con las variables de{" "}
        <code className="rounded bg-mist px-1.5">.env.example</code> y reinicia el servidor. El README explica cómo
        hacerlo paso a paso.
      </p>
    </main>
  );
}
