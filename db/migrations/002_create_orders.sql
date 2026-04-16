CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id UUID NOT NULL, -- TODO: Add FK to users table when integrating with #1.2
  provider_id UUID, -- Can be assigned later

  status TEXT NOT NULL CHECK (
    status IN (
      'pending',
      'accepted',
      'active',
      'completed',
      'cancelled',
      'disputed'
    )
  ),

  service_type TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(10,2), -- Maxes at 99999999.99

  scheduled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() -- TODO: Add trigger to update this on row update
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled_at ON orders(scheduled_at);
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);