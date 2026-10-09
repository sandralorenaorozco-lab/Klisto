import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/panel/login-form";
import { getPanelSession, homeForRole, isPlatformAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar al panel", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/panel/login">) {
  const { next } = await searchParams;
  if (isSupabaseConfigured()) {
    const session = await getPanelSession();
    if (session) redirect(homeForRole(session.member.role));
    if (await isPlatformAdmin()) redirect("/admin");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-mist px-4 py-12">
      <Link href="/" aria-label="Ir a Klisto" className="mb-8">
        <Logo size={36} />
      </Link>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_1px_0_#D9DBE0] sm:p-8">
        <h1 className="font-display text-3xl font-bold">Entrar al panel</h1>
        <p className="mt-1 text-ink-soft">Administra tu negocio, la cocina y los pedidos.</p>
        <LoginForm next={typeof next === "string" ? next : ""} />
      </div>
    </main>
  );
}
