export type OrderStatus =
  | "pending"
  | "accepted"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["active", "cancelled"],
  active: ["completed", "cancelled", "disputed"],

  completed: [],
  cancelled: [],
  disputed: [],
};

export function isValidTransition(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[current].includes(next);
}

export function validateStateTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  if (!isValidTransition(current, next)) {
    throw new Error(`Invalid order state transition: ${current} → ${next}`);
  }
}
