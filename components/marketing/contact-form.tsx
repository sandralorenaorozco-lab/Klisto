"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/(marketing)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const INITIAL: LeadState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitLead, INITIAL);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-ready p-6 text-ready-ink">
        <p className="font-display text-xl font-bold">Recibimos tus datos</p>
        <p className="mt-2">{state.message}</p>
      </div>
    );
  }

  const e = state.errors ?? {};
  const invalid = (k: string) => (e[k] ? { "aria-invalid": true, "aria-describedby": `lead-${k}-error` } : {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tu nombre" htmlFor="lead-name" error={e.name}>
          <Input id="lead-name" name="name" autoComplete="name" required {...invalid("name")} />
        </Field>
        <Field label="Nombre del negocio" htmlFor="lead-businessName" error={e.businessName}>
          <Input id="lead-businessName" name="businessName" autoComplete="organization" required {...invalid("businessName")} />
        </Field>
        <Field label="Celular (WhatsApp)" htmlFor="lead-phone" error={e.phone} hint="10 dígitos, ej. 300 123 4567">
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            {...invalid("phone")}
          />
        </Field>
        <Field label="Correo (opcional)" htmlFor="lead-email" error={e.email}>
          <Input id="lead-email" name="email" type="email" autoComplete="email" {...invalid("email")} />
        </Field>
        <Field label="Ciudad" htmlFor="lead-city" error={e.city}>
          <Input id="lead-city" name="city" autoComplete="address-level2" />
        </Field>
        <Field label="Tipo de negocio" htmlFor="lead-businessType">
          <Select id="lead-businessType" name="businessType" defaultValue="">
            <option value="">Selecciona…</option>
            <option>Restaurante</option>
            <option>Cafetería</option>
            <option>Panadería</option>
            <option>Peluquería</option>
            <option>Barbería</option>
            <option>Spa</option>
            <option>Consultorio</option>
            <option>Veterinaria</option>
            <option>Lavadero</option>
            <option>Taller</option>
            <option>Otro</option>
          </Select>
        </Field>
      </div>
      <Field label="¿Qué te gustaría resolver? (opcional)" htmlFor="lead-message">
        <Textarea id="lead-message" name="message" rows={3} maxLength={1000} />
      </Field>

      <div>
        <Checkbox
          id="lead-consent"
          name="dataConsent"
          required
          label={
            <>
              Autorizo a Klisto a tratar mis datos personales para contactarme sobre el servicio, según la{" "}
              <Link href="/politica-de-datos" className="font-semibold text-ink underline" target="_blank">
                política de tratamiento de datos
              </Link>{" "}
              (Ley 1581 de 2012).
            </>
          }
        />
        {e.dataConsent && (
          <p role="alert" className="text-sm font-medium text-danger">
            {e.dataConsent}
          </p>
        )}
      </div>

      {state.message && !state.ok && <Notice tone="error">{state.message}</Notice>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Enviando…" : "Quiero que me contacten"}
      </Button>
    </form>
  );
}
