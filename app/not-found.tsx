import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Logo size={36} />
      <h1 className="mt-8 font-display text-4xl font-bold">No encontramos esta página</h1>
      <p className="mt-3 max-w-md text-lg text-ink-soft">
        Revisa la dirección o el código QR. Si eres el dueño del negocio, verifica tu enlace en el panel.
      </p>
      <ButtonLink href="/" size="lg" className="mt-8">
        Ir a Klisto
      </ButtonLink>
    </main>
  );
}
