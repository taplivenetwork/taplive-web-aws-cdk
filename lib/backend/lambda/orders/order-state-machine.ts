import { OrderStatus } from "./order.types";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["active", "cancelled"],
  active: ["completed", "cancelled", "disputed"],

  completed: [],
  cancelled: [],
  disputed: [],
};

/**
 * Determines if transitioning from current to next state is valid based on `ORDER_TRANSITIONS`.
 * @param current Current state of the order.
 * @param next State to be transitioned to.
 * @returns `true` if the transition is valid, `false` otherwise.
 */
export function isValidTransition(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[current].includes(next);
}

/**
 * Enforces valid order state transitions.
 *
 * Terminal states (`completed`, `cancelled`, `disputed`) do not allow
 * further transitions.
 *
 * @param current Current state of the order.
 * @param next State to be transitioned to.
 * @throws Error if the transition is invalid.
 */
export function validateStateTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  if (!isValidTransition(current, next)) {
    throw new Error(`Invalid order state transition: ${current} → ${next}`);
  }
}
