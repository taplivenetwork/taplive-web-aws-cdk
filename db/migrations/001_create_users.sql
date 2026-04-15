CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  cognito_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT CONSTRAINT valid_role CHECK (role IN ('customer', 'provider', 'admin')) NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  bio TEXT,
  avg_rating DECIMAL(2, 1) CONSTRAINT valid_avg_rating CHECK (avg_rating BETWEEN 0.0 AND 5.0) DEFAULT 0.0, -- Accepts values like 4.5, 3.2, etc.
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() -- TODO: Add trigger to update this on row update
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_cognito_id ON users (cognito_id);