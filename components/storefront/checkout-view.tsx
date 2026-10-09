"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "./cart-context";
import { BizButton, BizLink } from "./biz-button";
import { placeOrder } from "@/app/[slug]/actions";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { IconArrowLeft, IconMinus, IconPlus, IconTrash } from "@/components/ui/icons";
import { formatCOP } from "@/lib/format";
import { isValidColombianMobile } from "@/lib/validation";

type Method = { id: string; label: string; description: string };

export function CheckoutView({ slug, businessName, paymentMethods }: { slug: string; businessName: string; paymentMethods: Method[] }) {
  const cart = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [payment, setPayment] = useState(paymentMethods[0]?.id ?? "pay_at_pickup");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (!cart.ready) return <div className="mx-auto max-w-3xl px-4 py-16" aria-busy="true" />;

  if (cart.count === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Tu pedido está vacío</h1>
        <p className="mt-2 text-muted">Agrega productos del menú para continuar.</p>
        <BizLink href={`/${slug}`} className="mt-6">
          Ver el menú
        </BizLink>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2 || !/\p{L}/u.test(name)) e.customerName = "Escribe tu nombre.";
    if (!isValidColombianMobile(phone)) e.customerPhone = "Escribe un celular colombiano de 10 dígitos que empiece por 3.";
    if (!consent) e.dataConsent = "Debes autorizar el tratamiento de tus datos para hacer el pedido.";
    return e;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(Object.keys(e)[0] === "dataConsent" ? "consent" : Object.keys(e)[0])?.focus();
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        slug,
        customerName: name,
        customerPhone: phone,
        notes: notes || undefined,
        paymentMethod: payment as "pay_at_pickup",
        dataConsent: consent as true,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, optionIds: l.optionIds, notes: l.notes })),
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      cart.clear();
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        router.push(`/${slug}/pedido/${result.token}?nuevo=1`);
      }
    });
  }

  const clearError = (k: string) => {
    if (!errors[k]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const invalid = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl space-y-8 px-4 pb-40 pt-6">
      <div className="flex items-center gap-2">
        <Link href={`/${slug}`} className="grid size-11 place-items-center rounded-full hover:bg-mist" aria-label="Volver al menú">
          <IconArrowLeft />
        </Link>
        <h1 className="font-display text-3xl font-bold">Tu pedido</h1>
      </div>

      <section aria-labelledby="resumen">
        <h2 id="resumen" className="sr-only">
          Productos
        </h2>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.name}</p>
                {l.modifiers.length > 0 && <p className="text-sm text-muted">{l.modifiers.map((m) => m.option).join(" · ")}</p>}
                {l.notes && <p className="text-sm italic text-ink-soft">“{l.notes}”</p>}
                <p className="mt-1 font-bold">{formatCOP(l.unitPrice * l.quantity)}</p>
              </div>
              <div className="flex items-center self-center rounded-xl border-2 border-line" role="group" aria-label={`Cantidad de ${l.name}`}>
                <button
                  type="button"
                  className="grid size-11 place-items-center"
                  onClick={() => cart.setQuantity(l.key, l.quantity - 1)}
                  aria-label={l.quantity === 1 ? `Quitar ${l.name}` : "Quitar uno"}
                >
                  {l.quantity === 1 ? <IconTrash size={20} /> : <IconMinus size={20} />}
                </button>
                <span className="w-7 text-center font-bold">{l.quantity}</span>
                <button
                  type="button"
                  className="grid size-11 place-items-center"
                  onClick={() => cart.setQuantity(l.key, l.quantity + 1)}
                  aria-label="Agregar uno"
                >
                  <IconPlus size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <Link href={`/${slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline">
          Agregar más productos
        </Link>
      </section>

      <section aria-labelledby="datos" className="space-y-4">
        <h2 id="datos" className="font-display text-xl font-bold">
          Tus datos
        </h2>
        <Field label="Nombre completo" htmlFor="customerName" error={errors.customerName}>
          <Input id="customerName" value={name} onChange={(e) => {
              setName(e.target.value);
              clearError("customerName");
            }} autoComplete="name" maxLength={80} {...invalid("customerName")} />
        </Field>
        <Field
          label="Celular"
          htmlFor="customerPhone"
          error={errors.customerPhone}
          hint="Te avisamos por WhatsApp cuando tu pedido esté listo."
        >
          <Input
            id="customerPhone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="300 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("customerPhone");
            }}
            maxLength={16}
            {...invalid("customerPhone")}
          />
        </Field>
        <Field label="Comentarios para el negocio (opcional)" htmlFor="notes">
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} placeholder="Ej.: paso a recoger en 20 minutos" />
        </Field>
      </section>

      <fieldset className="space-y-3">
        <legend className="mb-3 font-display text-xl font-bold">Método de pago</legend>
        {paymentMethods.map((m) => (
          <label key={m.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--biz)] p-4">
            <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="size-5 accent-[var(--biz)]" />
            <span>
              <span className="block font-semibold">{m.label}</span>
              <span className="block text-sm text-muted">{m.description}</span>
            </span>
          </label>
        ))}
        <p className="text-sm text-muted">Pronto: pago en línea con Nequi, PSE y tarjetas.</p>
      </fieldset>

      <div>
        <Checkbox
          id="consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            clearError("dataConsent");
          }}
          aria-invalid={errors.dataConsent ? true : undefined}
          aria-describedby={errors.dataConsent ? "dataConsent-error" : undefined}
          label={
            <>
              Autorizo a {businessName} y a Klisto a tratar mis datos personales (nombre y celular) para gestionar mi pedido y
              avisarme por WhatsApp, según la{" "}
              <Link href="/politica-de-datos" target="_blank" className="font-semibold text-ink underline">
                política de tratamiento de datos
              </Link>{" "}
              (Ley 1581 de 2012).
            </>
          }
        />
        {errors.dataConsent && (
          <p id="dataConsent-error" role="alert" className="text-sm font-medium text-danger">
            {errors.dataConsent}
          </p>
        )}
      </div>

      {formError && <Notice tone="error">{formError}</Notice>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <BizButton type="submit" disabled={pending} className="w-full justify-between py-3 text-lg">
            <span>{pending ? "Enviando pedido…" : "Confirmar pedido"}</span>
            <span>{formatCOP(cart.total)}</span>
          </BizButton>
        </div>
      </div>
    </form>
  );
}
