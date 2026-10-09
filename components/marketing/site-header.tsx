import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#industrias", label: "Industrias" },
  { href: "/#planes", label: "Planes" },
  { href: "/#preguntas", label: "Preguntas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Klisto, inicio" className="flex min-h-11 items-center">
          <Logo size={30} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-mist hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/panel/login"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-mist sm:inline-flex"
          >
            Entrar
          </Link>
          <ButtonLink href="/#contacto" size="md">
            Quiero Klisto
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
