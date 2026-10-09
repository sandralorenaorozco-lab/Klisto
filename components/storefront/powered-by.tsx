import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function PoweredBy() {
  return (
    <Link href="/" className="mt-10 inline-flex min-h-11 items-center gap-2 text-sm text-muted">
      Funciona con <Logo size={20} />
    </Link>
  );
}
