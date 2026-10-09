"use client";

import { useActionState } from "react";
import { lookupOrder, type LookupState } from "@/app/[slug]/actions";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { BizButton } from "@/components/storefront/biz-button";
import { ActionForm } from "@/components/ui/action-form";

export function LookupForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, {});
  return (
    <ActionForm action={action} className="mt-6 space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <Field label="Código del pedido" htmlFor="code" hint="Ej.: SLO-4521-05">
        <Input id="code" name="code" autoCapitalize="characters" autoComplete="off" required className="uppercase" />
      </Field>
      <Field label="Celular" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <BizButton type="submit" disabled={pending} className="w-full">
        {pending ? "Buscando…" : "Ver mi pedido"}
      </BizButton>
    </ActionForm>
  );
}
