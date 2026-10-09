"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/panel/actions";
import { LogoMark } from "@/components/ui/logo";
import {
  IconChart,
  IconChef,
  IconList,
  IconLogout,
  IconQr,
  IconSettings,
  IconUsers,
  IconBag,
} from "@/components/ui/icons";
import { ROLE_LABELS, type MemberRole } from "@/lib/orders/status";
import type { ReactNode } from "react";

type Item = { href: string; label: string; icon: ReactNode; roles: MemberRole[] };

const ITEMS: Item[] = [
  { href: "/panel", label: "Inicio", icon: <IconChart size={20} />, roles: ["owner"] },
  { href: "/panel/cocina", label: "Cocina", icon: <IconChef size={20} />, roles: ["owner", "chef", "waiter"] },
  { href: "/panel/pedidos", label: "Pedidos", icon: <IconList size={20} />, roles: ["owner", "chef", "waiter"] },
  { href: "/panel/menu", label: "Menú", icon: <IconBag size={20} />, roles: ["owner"] },
  { href: "/panel/equipo", label: "Equipo", icon: <IconUsers size={20} />, roles: ["owner"] },
  { href: "/panel/qr", label: "Código QR", icon: <IconQr size={20} />, roles: ["owner"] },
  { href: "/panel/reportes", label: "Reportes", icon: <IconChart size={20} />, roles: ["owner"] },
  { href: "/panel/configuracion", label: "Configuración", icon: <IconSettings size={20} />, roles: ["owner"] },
];

export function PanelNav({
  role,
  displayName,
  businessName,
  businessSlug,
  suspended,
}: {
  role: MemberRole;
  displayName: string;
  businessName: string;
  businessSlug: string;
  suspended: boolean;
}) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.roles.includes(role));
  const isActive = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link href={items[0].href} className="flex min-h-11 items-center gap-2" aria-label="Inicio del panel">
          <LogoMark size={28} />
          <span className="hidden font-display font-bold sm:inline">{businessName}</span>
        </Link>
        <span className="ml-auto hidden text-right text-xs leading-tight text-white/70 sm:block">
          {displayName}
          <br />
          {ROLE_LABELS[role]}
        </span>
        <Link
          href={`/${businessSlug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white/80 hover:bg-white/10 max-sm:ml-auto"
        >
          Ver mi página
        </Link>
        <form action={signOut}>
          <button type="submit" className="grid size-11 place-items-center rounded-lg hover:bg-white/10" aria-label="Cerrar sesión">
            <IconLogout size={20} />
          </button>
        </form>
      </div>
      <nav aria-label="Panel" className="overflow-x-auto border-t border-white/10 [scrollbar-width:none]">
        <ul className="flex gap-1 px-2">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${
                  isActive(item.href) ? "border-brand text-white" : "border-transparent text-white/70 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {suspended && (
        <p className="bg-danger px-4 py-2 text-center text-sm font-semibold">
          Tu suscripción está suspendida: tu página pública no recibe pedidos. Comunícate con Klisto.
        </p>
      )}
    </header>
  );
}
