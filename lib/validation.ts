import { z } from "zod";

/** Quita espacios, guiones y el prefijo +57 / 57. */
export function normalizeColombianMobile(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("57")) digits = digits.slice(2);
  return digits;
}

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export function isValidColombianMobile(value: string): boolean {
  return /^3\d{9}$/.test(normalizeColombianMobile(value));
}

export const colombianMobile = z
  .string()
  .transform(normalizeColombianMobile)
  .refine((v) => /^3\d{9}$/.test(v), {
    message: "Escribe un celular colombiano de 10 dígitos que empiece por 3.",
  });

export const personName = z
  .string()
  .trim()
  .min(2, "Escribe tu nombre.")
  .max(80, "El nombre es muy largo.")
  .refine((v) => /\p{L}/u.test(v), "El nombre debe tener letras.");

export const DATA_POLICY_VERSION = "2026-10-01";

export const checkoutSchema = z.object({
  slug: z.string().min(1),
  customerName: personName,
  customerPhone: colombianMobile,
  notes: z.string().trim().max(300).optional(),
  paymentMethod: z.literal("pay_at_pickup"),
  dataConsent: z.literal(true, { message: "Debes autorizar el tratamiento de tus datos." }),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(99),
        optionIds: z.array(z.uuid()).max(30),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1, "Tu carrito está vacío.")
    .max(50),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const leadSchema = z.object({
  name: personName,
  businessName: z.string().trim().min(2, "Escribe el nombre del negocio.").max(120),
  phone: colombianMobile,
  email: z.union([z.literal(""), z.email("Correo no válido.")]).optional(),
  city: z.string().trim().max(80).optional(),
  businessType: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1000).optional(),
  dataConsent: z.literal(true, { message: "Debes autorizar el tratamiento de tus datos." }),
});

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._]{2,29}$/, "Usuario de 3 a 30 caracteres: letras, números, punto o guion bajo.");

/** Número de documento (cédula) usado como contraseña del personal. */
export const documentNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{6,12}$/, "El número de documento debe tener entre 6 y 12 dígitos, sin puntos.");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/, "Solo minúsculas, números y guiones (3 a 40 caracteres).");
