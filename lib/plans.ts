/**
 * Planes de Klisto. Edita aquí los precios (reemplaza "[PRECIO]").
 * Por ahora los límites son informativos; no se aplican automáticamente.
 */
export type Plan = {
  id: "basico" | "pro" | "premium";
  name: string;
  price: string; // ej. "$89.000"
  tagline: string;
  recommended?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: "[PRECIO]",
    tagline: "Para empezar a recibir pedidos sin filas.",
    features: [
      "Página propia klisto.co/tu-negocio y código QR",
      "Menú digital con fotos, hasta 40 productos",
      "Pedidos para recoger y pago en el local",
      "Seguimiento del pedido en tiempo real",
      "Pantalla de cocina",
      "Hasta 3 usuarios del equipo",
      "Soporte por correo",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "[PRECIO]",
    tagline: "El favorito de los restaurantes con movimiento.",
    recommended: true,
    features: [
      "Todo lo del plan Básico",
      "Productos ilimitados con modificadores y adiciones",
      "Avisos por WhatsApp: pedido confirmado y pedido listo",
      "Logo y color de tu marca",
      "Reportes de ventas y productos más vendidos",
      "Hasta 10 usuarios del equipo (meseros y chefs)",
      "Soporte prioritario por WhatsApp",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "[PRECIO]",
    tagline: "Para negocios con varias sedes o alto volumen.",
    features: [
      "Todo lo del plan Pro",
      "Usuarios del equipo ilimitados",
      "Pagos en línea con Nequi, PSE y tarjetas (próximamente)",
      "Varias sedes en una sola cuenta (próximamente)",
      "Módulo de citas incluido cuando esté disponible",
      "Acompañamiento para cargar tu menú",
      "Gerente de cuenta dedicado",
    ],
  },
];

export const PLAN_LABELS: Record<Plan["id"], string> = {
  basico: "Básico",
  pro: "Pro",
  premium: "Premium",
};
