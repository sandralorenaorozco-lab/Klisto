import type { ComponentProps, ReactNode } from "react";

export const inputClasses =
  "block w-full min-h-12 rounded-xl border-2 border-line bg-white px-4 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none disabled:bg-mist aria-[invalid=true]:border-danger";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, children, className = "" }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${inputClasses} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${inputClasses} min-h-24 py-3 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${inputClasses} ${className}`} {...props} />;
}

export function Checkbox({ label, id, ...props }: ComponentProps<"input"> & { label: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm text-ink-soft">
      <input id={id} type="checkbox" className="mt-0.5 size-6 shrink-0 accent-[#FF6A2B]" {...props} />
      <span>{label}</span>
    </label>
  );
}
