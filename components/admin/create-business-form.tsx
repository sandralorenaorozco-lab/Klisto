"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBusiness } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { ActionState } from "@/lib/panel";
import { ActionForm } from "@/components/ui/action-form";

export function CreateBusinessForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBusiness, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const e = state.errors ?? {};
  return (
    <ActionForm ref={ref} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del negocio" htmlFor="b-name" error={e.name}>
          <Input id="b-name" name="name" required />
        </Field>
        <Field label="Dirección (klisto.co/…)" htmlFor="b-slug" error={e.slug} hint="Minúsculas, números y guiones.">
          <Input id="b-slug" name="slug" required autoCapitalize="none" />
        </Field>
        <Field label="Tipo" htmlFor="b-type">
          <Select id="b-type" name="business_type" defaultValue="restaurant">
            <option value="restaurant">Restaurante / pedidos</option>
            <option value="services">Servicios / citas (próximamente)</option>
          </Select>
        </Field>
        <Field label="Plan" htmlFor="b-plan">
          <Select id="b-plan" name="plan" defaultValue="pro">
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </Select>
        </Field>
        <Field label="Nombre del dueño" htmlFor="b-owner" error={e.owner_name}>
          <Input id="b-owner" name="owner_name" required />
        </Field>
        <Field label="Correo del dueño" htmlFor="b-email" error={e.owner_email}>
          <Input id="b-email" name="owner_email" type="email" required />
        </Field>
        <Field label="Contraseña temporal" htmlFor="b-pass" error={e.owner_password} hint="Mínimo 8 caracteres.">
          <Input id="b-pass" name="owner_password" type="text" autoComplete="off" required />
        </Field>
      </div>
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando…" : "Crear negocio"}
      </Button>
    </ActionForm>
  );
}
