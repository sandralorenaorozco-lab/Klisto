import type { Metadata } from "next";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth";
import { signOut } from "@/app/panel/actions";
import { Logo } from "@/components/ui/logo";
import { IconLogout } from "@/components/ui/icons";

export const metadata: Metadata = { title: { default: "Administración", template: "%s · Admin Klisto" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requirePlatformAdmin();
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-mist">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link href="/admin" className="flex min-h-11 items-center gap-2">
            <Logo inverted size={26} />
            <span className="rounded bg-brand px-2 py-0.5 text-xs font-bold text-ink">Admin</span>
          </Link>
          <nav aria-label="Administración" className="flex gap-1">
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-white/10">
              Negocios
            </Link>
            <Link href="/admin/leads" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-white/10">
              Interesados
            </Link>
          </nav>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="grid size-11 place-items-center rounded-lg hover:bg-white/10" aria-label="Cerrar sesión">
              <IconLogout size={20} />
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
