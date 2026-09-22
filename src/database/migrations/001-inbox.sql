CREATE TABLE IF NOT EXISTS invoice_inbox (
  invoice_id UUID PRIMARY KEY,
  document_id UUID NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ,
  last_error TEXT,
  pdf BYTEA,
  reported_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_inbox_jobs_idx
  ON invoice_inbox (status, received_at);
