export type Order = {
  order_id: string;
  customer_id: string;
  provider_id: string | null;
  status: OrderStatus;
  service_type: string;
  description: string | null;
  budget: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";