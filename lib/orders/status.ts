/**
 * Estados del pedido y reglas de transición.
 * IMPORTANTE: debe coincidir con las funciones SQL
 * is_valid_status_transition y role_can_set_status
 * (supabase/migrations/20261009000002_functions.sql).
 */

export const ORDER_STATUSES = [
  "received",
  "preparing",
  "packing",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type MemberRole = "owner" | "waiter" | "chef";

/** Flujo normal, en orden. Cancelado queda fuera de la línea de tiempo. */
export const STATUS_FLOW: readonly OrderStatus[] = [
  "received",
  "preparing",
  "packing",
  "ready",
  "delivered",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  preparing: "En preparación",
  packing: "Empacando",
  ready: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

/** Texto del botón grande que avanza al siguiente estado. */
export const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  preparing: "Empezar a preparar",
  packing: "Pasar a empacar",
  ready: "Marcar listo",
  delivered: "Marcar entregado",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Dueño / Administrador",
  waiter: "Mesero",
  chef: "Chef",
};

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["packing", "cancelled"],
  packing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const ROLE_ALLOWED_TARGETS: Record<MemberRole, readonly OrderStatus[]> = {
  owner: ORDER_STATUSES,
  chef: ["preparing", "packing", "ready", "cancelled"],
  waiter: ["delivered", "cancelled"],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Siguiente estado del flujo normal (null si ya terminó o fue cancelado). */
export function getNextStatus(status: OrderStatus): OrderStatus | null {
  return TRANSITIONS[status].find((s) => s !== "cancelled") ?? null;
}

export function roleCanSetStatus(role: MemberRole, to: OrderStatus): boolean {
  return ROLE_ALLOWED_TARGETS[role].includes(to);
}

export class StatusTransitionError extends Error {}

/** Lanza un error en español si la transición o el rol no son válidos. */
export function assertCanChangeStatus(
  from: OrderStatus,
  to: OrderStatus,
  role?: MemberRole,
): void {
  if (!canTransition(from, to)) {
    throw new StatusTransitionError(
      `No se puede pasar de "${STATUS_LABELS[from]}" a "${STATUS_LABELS[to]}".`,
    );
  }
  if (role && !roleCanSetStatus(role, to)) {
    throw new StatusTransitionError(
      `Como ${ROLE_LABELS[role].toLowerCase()} no puedes marcar pedidos como "${STATUS_LABELS[to]}".`,
    );
  }
}

/** Posición en la línea de tiempo (−1 si está cancelado). */
export function getTimelineIndex(status: OrderStatus): number {
  return STATUS_FLOW.indexOf(status);
}

/** Estados que la cocina debe ver como "activos". */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ["received", "preparing", "packing", "ready"];
