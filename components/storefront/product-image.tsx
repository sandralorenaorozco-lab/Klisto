import { getInitials } from "@/lib/orders/code";

/** Foto del producto o, si no tiene, una ficha con sus iniciales en el color del negocio. */
export function ProductImage({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  if (src) {
    return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />;
  }
  let initials = "";
  try {
    initials = getInitials(name).slice(0, 2);
  } catch {
    initials = "";
  }
  return (
    <div
      aria-hidden="true"
      className={`grid place-items-center bg-[color-mix(in_srgb,var(--biz)_14%,white)] font-display font-bold text-[color-mix(in_srgb,var(--biz)_70%,#15171C)] ${className}`}
    >
      <span className="text-2xl">{initials}</span>
    </div>
  );
}
