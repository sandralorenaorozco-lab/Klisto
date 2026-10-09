import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto w-full ${wide ? "max-w-6xl" : "max-w-4xl"} flex-1 px-4 py-6 sm:py-8`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          {description && <p className="mt-1 text-ink-soft">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 shadow-[0_1px_0_#D9DBE0] sm:p-6 ${className}`}>{children}</section>;
}
