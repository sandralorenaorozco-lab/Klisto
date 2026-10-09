"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaff, resetStaffPassword } from "@/app/panel/(app)/equipo/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { ActionState } from "@/lib/panel";

export function StaffCreateForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createStaff, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const e = state.errors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="display_name" error={e.display_name}>
          <Input id="display_name" name="display_name" required maxLength={80} />
        </Field>
        <Field label="Rol" htmlFor="role" error={e.role}>
          <Select id="role" name="role" defaultValue="waiter">
            <option value="waiter">Mesero</option>
            <option value="chef">Chef</option>
          </Select>
        </Field>
        <Field label="Usuario" htmlFor="username" error={e.username} hint="Ej.: juan.perez (sin espacios)">
          <Input id="username" name="username" autoCapitalize="none" required maxLength={30} />
        </Field>
        <Field label="Número de documento (será su contraseña)" htmlFor="document" error={e.document} hint="Cédula sin puntos, 6 a 12 dígitos.">
          <Input id="document" name="document" inputMode="numeric" required maxLength={15} autoComplete="off" />
        </Field>
      </div>
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}

export function StaffPasswordForm({ memberId, name }: { memberId: string; name: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetStaffPassword, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={memberId} />
      <label className="flex flex-col text-sm font-semibold">
        Nuevo documento / contraseña
        <input
          name="document"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`Nueva contraseña para ${name}`}
          className="mt-1 min-h-11 w-44 rounded-lg border-2 border-line px-3 font-normal focus:border-brand focus:outline-none"
        />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-mist px-3 text-sm font-semibold">
        Cambiar
      </button>
      {state.message && (
        <span role="status" className={`text-sm font-semibold ${state.ok ? "text-ready-ink" : "text-danger"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
