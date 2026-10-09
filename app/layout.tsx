import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Klisto · Pide, reserva y recoge ya mismo",
    template: "%s · Klisto",
  },
  description:
    "Klisto le da a tu negocio una página propia con código QR para que tus clientes pidan o reserven desde el celular. Tarifa fija mensual, cero comisiones.",
  applicationName: "Klisto",
  appleWebApp: { capable: true, title: "Klisto", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FF6A2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
