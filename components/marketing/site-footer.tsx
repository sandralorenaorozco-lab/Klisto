import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo inverted size={30} />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            Pide, reserva y recoge ya mismo. Hecho en Colombia para negocios que quieren atender mejor.
          </p>
        </div>

        <FooterCol
          title="Producto"
          links={[
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "/#planes", label: "Planes" },
            { href: "/demo", label: "Ver demo" },
          ]}
        />
        <FooterCol
          title="Negocios"
          links={[
            { href: "/panel/login", label: "Entrar al panel" },
            { href: "/#contacto", label: "Hablar con ventas" },
            { href: "/#preguntas", label: "Preguntas frecuentes" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/politica-de-datos", label: "Política de tratamiento de datos" },
            { href: "/politica-de-datos#derechos", label: "Tus derechos (Ley 1581 de 2012)" },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-white/60">
          © {new Date().getFullYear()} Klisto. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-sm font-bold text-white">{title}</h2>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-11 items-center text-sm hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
