import type { Metadata } from "next";
import QRCode from "qrcode";
import { requirePanel } from "@/lib/auth";
import { PageShell, Card } from "@/components/panel/page-shell";
import { PrintButton } from "@/components/panel/print-button";
import { buttonClasses } from "@/components/ui/button";
import { IconDownload } from "@/components/ui/icons";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = { title: "Código QR" };

export default async function QrPage() {
  const { business } = await requirePanel(["owner"]);
  const url = `${SITE_URL}/${business.slug}`;
  const options = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#15171C", light: "#FFFFFF" } };
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...options, type: "svg" }),
    QRCode.toDataURL(url, { ...options, width: 1024 }),
  ]);
  const svgHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const file = `qr-${business.slug}`;

  return (
    <PageShell title="Código QR" description="Imprímelo y ponlo en mesas, mostrador, empaques y redes sociales.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="print:shadow-none">
          <div id="poster" className="mx-auto max-w-sm text-center">
            <p className="font-display text-3xl font-extrabold">{business.name}</p>
            <p className="mt-1 text-lg text-ink-soft">Escanea, pide y recoge sin filas</p>
            <img src={png} alt={`Código QR que lleva a ${url}`} className="mx-auto mt-4 w-full max-w-72" />
            <p className="mt-2 break-all font-semibold">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        </Card>
        <Card className="print:hidden">
          <h2 className="font-display text-xl font-bold">Tu enlace</h2>
          <p className="mt-2 break-all rounded-xl bg-mist px-4 py-3 font-mono text-sm">{url}</p>
          <div className="mt-6 flex flex-col gap-3">
            <a href={png} download={`${file}.png`} className={buttonClasses("primary", "lg")}>
              <IconDownload size={20} /> Descargar PNG
            </a>
            <a href={svgHref} download={`${file}.svg`} className={buttonClasses("outline", "lg")}>
              <IconDownload size={20} /> Descargar SVG (para imprenta)
            </a>
            <PrintButton />
          </div>
          <p className="mt-6 text-sm text-muted">
            Consejo: imprímelo de al menos 3 × 3 cm y pruébalo con tu celular antes de imprimir muchas copias.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
