CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,

  old_status TEXT,
  new_status TEXT NOT NULL CHECK (
    new_status IN (
      'pending',
      'accepted',
      'active',
      'completed',
      'cancelled',
      'disputed'
    )
  ),

  changed_by UUID NOT NULL, -- TODO: Add FK to users table when integrating with #1.2

  reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX idx_order_status_log_created_at ON order_status_log(created_at);