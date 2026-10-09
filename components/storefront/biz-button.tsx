import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

/** Botón con el color principal del negocio (texto con contraste automático). */
export function BizButton({ className = "", ...props }: ComponentProps<"button">) {
  return <button className={`${base} bg-[var(--biz)] text-[var(--biz-ink)] ${className}`} {...props} />;
}

export function BizLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link className={`${base} bg-[var(--biz)] text-[var(--biz-ink)] ${className}`} {...props} />;
}
