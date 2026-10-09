type LogoProps = { className?: string; showWord?: boolean; size?: number; inverted?: boolean };

/** Logo provisional: cuadrado redondeado naranja con una "K" negra + "klisto". */
export function Logo({ className = "", showWord = true, size = 32, inverted = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showWord && (
        <span
          className={`font-display font-bold tracking-tight ${inverted ? "text-white" : "text-ink"}`}
          style={{ fontSize: size * 0.78 }}
        >
          klisto
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#FF6A2B" />
      <path d="M20 14h8v15.5L40.5 14H50L36.6 30.6 51 50h-9.8L31 35.8 28 39.4V50h-8z" fill="#15171C" />
    </svg>
  );
}
