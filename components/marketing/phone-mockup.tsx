import { IconCheck } from "@/components/ui/icons";

/** Ilustración del seguimiento del pedido en un celular (solo HTML/CSS). */
export function PhoneMockup() {
  const steps = [
    { label: "Recibido", done: true },
    { label: "En preparación", done: true },
    { label: "Empacando", done: true },
    { label: "Listo para recoger", done: true, current: true },
    { label: "Entregado", done: false },
  ];

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-ink bg-white shadow-[0_30px_80px_-30px_rgba(21,23,28,0.45)]"
    >
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <div className="space-y-4 px-5 pb-6 pt-10">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-brand font-display text-sm font-bold text-ink">KB</span>
          <div>
            <p className="text-sm font-bold leading-tight">Klisto Burger</p>
            <p className="text-xs text-muted">Tu pedido</p>
          </div>
        </div>

        <div className="rounded-2xl bg-ready p-4 text-ready-ink">
          <p className="text-xs font-semibold uppercase tracking-wide">Listo para recoger</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight">SLO-4521-05</p>
          <p className="mt-1 text-xs">Muestra este código en la caja</p>
        </div>

        <ol className="space-y-2.5">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={`grid size-6 place-items-center rounded-full ${
                  s.current ? "bg-ready-ink text-white" : s.done ? "bg-ink text-white" : "border-2 border-line"
                }`}
              >
                {s.done && <IconCheck size={14} strokeWidth={3} />}
              </span>
              <span className={`text-sm ${s.current ? "font-bold" : s.done ? "text-ink" : "text-muted"}`}>{s.label}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-xl bg-mist p-3 text-xs text-ink-soft">
          2 × Klisto Clásica · 2 × Limonada de coco
          <span className="mt-1 block font-bold text-ink">Total $73.600</span>
        </div>
      </div>
    </div>
  );
}
