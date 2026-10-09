"use client";

import { useActionState, useState } from "react";
import { saveSettings } from "@/app/panel/(app)/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { DAY_KEYS, DAY_LABELS } from "@/lib/hours";
import { contrastRatio } from "@/lib/color";
import type { ActionState } from "@/lib/panel";
import type { Business } from "@/lib/types";

export function SettingsForm({ business }: { business: Business }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, {});
  const [color, setColor] = useState(business.primary_color);
  const e = state.errors ?? {};
  const lowContrast = Math.max(contrastRatio(color, "#15171C"), contrastRatio(color, "#FFFFFF")) < 4.5;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del negocio" htmlFor="name" error={e.name}>
          <Input id="name" name="name" defaultValue={business.name} required maxLength={80} />
        </Field>
        <Field label="Celular del negocio" htmlFor="phone" error={e.phone} hint="Se muestra a tus clientes para dudas.">
          <Input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={business.phone ?? ""} />
        </Field>
        <Field label="Dirección" htmlFor="address" className="sm:col-span-2">
          <Input id="address" name="address" defaultValue={business.address ?? ""} maxLength={160} />
        </Field>
        <Field label="Color principal" htmlFor="primary_color" error={e.primary_color} hint={lowContrast ? "Este color tiene poco contraste; prueba uno más oscuro o más claro." : "Se usa en botones y detalles de tu página."}>
          <div className="flex items-center gap-3">
            <input
              id="primary_color"
              name="primary_color"
              type="color"
              value={color}
              onChange={(ev) => setColor(ev.target.value.toUpperCase())}
              className="h-12 w-20 cursor-pointer rounded-xl border-2 border-line bg-white p-1"
            />
            <span className="font-mono text-sm">{color}</span>
          </div>
        </Field>
        <div className="space-y-2">
          <Field label="Logo" htmlFor="logo" hint="Cuadrado, JPG, PNG o WebP, máximo 5 MB.">
            <div className="flex items-center gap-3">
              {business.logo_url && <img src={business.logo_url} alt="Logo actual" className="size-12 rounded-xl object-cover" />}
              <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="py-2" />
            </div>
          </Field>
          {business.logo_url && <Checkbox id="remove_logo" name="remove_logo" label="Quitar el logo" />}
        </div>
      </div>

      <fieldset>
        <legend className="font-display text-lg font-bold">Horario de atención</legend>
        <p className="text-sm text-muted">Fuera de este horario tu página muestra el menú pero no recibe pedidos. Déjalo vacío para no tener restricción.</p>
        {e.hours && <p className="mt-2 text-sm font-semibold text-danger">{e.hours}</p>}
        <div className="mt-3 divide-y divide-line">
          {DAY_KEYS.map((day) => {
            const h = business.opening_hours?.[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-2">
                <span className="w-24 font-semibold">{DAY_LABELS[day]}</span>
                <label className="sr-only" htmlFor={`${day}_open`}>
                  Abre el {DAY_LABELS[day]}
                </label>
                <input id={`${day}_open`} name={`${day}_open`} type="time" defaultValue={h?.open ?? ""} className="min-h-11 rounded-lg border-2 border-line px-2" />
                <span aria-hidden="true">a</span>
                <label className="sr-only" htmlFor={`${day}_close`}>
                  Cierra el {DAY_LABELS[day]}
                </label>
                <input id={`${day}_close`} name={`${day}_close`} type="time" defaultValue={h?.close ?? ""} className="min-h-11 rounded-lg border-2 border-line px-2" />
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name={`${day}_closed`} defaultChecked={h?.closed} className="size-5 accent-[#FF6A2B]" />
                  Cerrado
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <Checkbox
        id="accepting_orders"
        name="accepting_orders"
        defaultChecked={business.accepting_orders}
        label="Recibir pedidos en línea (desmárcalo para pausarlos temporalmente)"
      />

      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </form>
  );
}
