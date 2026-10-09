import Link from "next/link";
import { IconClock, IconMapPin } from "@/components/ui/icons";
import { isOpenNow, todayHoursLabel } from "@/lib/hours";
import type { PublicBusiness } from "@/lib/types";

export function BusinessHeader({ business, compact = false }: { business: PublicBusiness; compact?: boolean }) {
  const open = isOpenNow(business.opening_hours, business.timezone);
  const hours = todayHoursLabel(business.opening_hours, business.timezone);

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <Link href={`/${business.slug}`} className="flex min-h-11 items-center gap-3">
          {business.logo_url ? (
            <img src={business.logo_url} alt="" className="size-12 rounded-xl object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-xl bg-[var(--biz)] font-display text-lg font-bold text-[var(--biz-ink)]">
              {business.name.slice(0, 1)}
            </span>
          )}
          <span>
            <span className="block font-display text-xl font-bold leading-tight">{business.name}</span>
            {!compact && (
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className={`inline-flex items-center gap-1 font-semibold ${open ? "text-ready-ink" : "text-danger"}`}>
                  <IconClock size={14} /> {open ? "Abierto" : "Cerrado"}
                </span>
                {hours && <span>{hours}</span>}
              </span>
            )}
          </span>
        </Link>
      </div>
      {!compact && business.address && (
        <p className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pb-3 text-sm text-muted">
          <IconMapPin size={16} className="shrink-0" /> {business.address}
        </p>
      )}
    </header>
  );
}
