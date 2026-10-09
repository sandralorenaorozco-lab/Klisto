"use client";

import { useTransition, type ComponentProps } from "react";

/**
 * Formulario para acciones de servidor con useActionState.
 * A diferencia de <form action={...}>, NO borra los campos al enviar: si hay
 * un error de validación, la persona no pierde lo que escribió.
 */
export function ActionForm({
  action,
  ...props
}: Omit<ComponentProps<"form">, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  const [, startTransition] = useTransition();
  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    />
  );
}
