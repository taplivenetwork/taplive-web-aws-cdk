import {
  isValidTransition,
  ORDER_TRANSITIONS,
  validateStateTransition,
} from "../lib/backend/lambda/orders/order-state-machine";
import { OrderStatus } from "../lib/backend/lambda/orders/order.types";

describe("OrderStateMachine", () => {
  describe("isValidTransition", () => {
    it("returns true for valid transitions", () => {
      expect(isValidTransition("pending", "accepted")).toBe(true);
      expect(isValidTransition("pending", "cancelled")).toBe(true);
      expect(isValidTransition("accepted", "active")).toBe(true);
      expect(isValidTransition("active", "completed")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(isValidTransition("pending", "active")).toBe(false);
      expect(isValidTransition("completed", "pending")).toBe(false);
      expect(isValidTransition("cancelled", "active")).toBe(false);
    });

    it("returns false for terminal states transitioning anywhere", () => {
      const terminalStates: OrderStatus[] = [
        "completed",
        "cancelled",
        "disputed",
      ];

      terminalStates.forEach((state) => {
        expect(isValidTransition(state, "pending")).toBe(false);
      });
    });
  });

  describe("validateStateTransition", () => {
    it("does not throw for valid transitions", () => {
      expect(() =>
        validateStateTransition("pending", "accepted"),
      ).not.toThrow();

      expect(() =>
        validateStateTransition("active", "completed"),
      ).not.toThrow();
    });

    it("throws error for invalid transitions", () => {
      expect(() => validateStateTransition("pending", "active")).toThrow(
        "Invalid order state transition",
      );

      expect(() => validateStateTransition("completed", "pending")).toThrow();
    });

    it("throws for terminal state transitions", () => {
      expect(() => validateStateTransition("completed", "active")).toThrow();

      expect(() => validateStateTransition("cancelled", "pending")).toThrow();
    });
  });

  describe("ORDER_TRANSITIONS integrity", () => {
    it("should have all states defined", () => {
      const states: OrderStatus[] = [
        "pending",
        "accepted",
        "active",
        "completed",
        "cancelled",
        "disputed",
      ];

      states.forEach((state) => {
        expect(ORDER_TRANSITIONS[state]).toBeDefined();
      });
    });
  });
});
