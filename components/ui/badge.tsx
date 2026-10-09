import type { ReactNode } from "react";

type Tone = "neutral" | "brand" | "ready" | "danger" | "dark";

const TONES: Record<Tone, string> = {
  neutral: "bg-mist text-ink-soft",
  brand: "bg-brand-soft text-[#9a3a0e]",
  ready: "bg-ready text-ready-ink",
  danger: "bg-danger-soft text-danger",
  dark: "bg-ink text-white",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
