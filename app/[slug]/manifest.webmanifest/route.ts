import { getPublicBusiness } from "@/lib/data/catalog";

/** Manifest PWA por negocio: el cliente puede "instalar" la página en su celular. */
export async function GET(_request: Request, { params }: RouteContext<"/[slug]/manifest.webmanifest">) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) return new Response("No encontrado", { status: 404 });

  return Response.json(
    {
      name: business.name,
      short_name: business.name.slice(0, 12),
      description: `Pide en ${business.name} desde tu celular`,
      start_url: `/${business.slug}`,
      scope: `/${business.slug}`,
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: business.primary_color,
      lang: "es-CO",
      icons: [
        ...(business.logo_url
          ? [{ src: business.logo_url, sizes: "any" }]
          : [
              { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
              { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            ]),
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
