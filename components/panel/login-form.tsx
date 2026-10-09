"use client";

import { useActionState, useState } from "react";
import { signIn, type LoginState } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ActionForm } from "@/components/ui/action-form";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"owner" | "staff">("owner");
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Tipo de usuario" className="grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
        {(
          [
            ["owner", "Dueño o administrador"],
            ["staff", "Mesero o chef"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`min-h-11 rounded-lg px-2 text-sm font-semibold ${mode === value ? "bg-white text-ink shadow-sm" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <ActionForm action={action} className="mt-6 space-y-4" key={mode}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={next} />
        {mode === "owner" ? (
          <>
            <Field label="Correo" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </Field>
            <Field label="Contraseña" htmlFor="password">
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </Field>
          </>
        ) : (
          <>
            <Field label="Código del negocio" htmlFor="slug" hint="Es lo que va después de klisto.co/, ej.: demo">
              <Input id="slug" name="slug" autoCapitalize="none" autoComplete="organization" required />
            </Field>
            <Field label="Usuario" htmlFor="username">
              <Input id="username" name="username" autoCapitalize="none" autoComplete="username" required />
            </Field>
            <Field label="Número de documento" htmlFor="password" hint="Tu cédula, sin puntos.">
              <Input id="password" name="password" type="password" inputMode="numeric" autoComplete="current-password" required />
            </Field>
          </>
        )}
        {state.error && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </ActionForm>
    </div>
  );
}
