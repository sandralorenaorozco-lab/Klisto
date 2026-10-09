import type { ReactNode } from "react";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "bg-mist text-ink-soft",
    error: "bg-danger-soft text-danger",
    success: "bg-ready text-ready-ink",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}
