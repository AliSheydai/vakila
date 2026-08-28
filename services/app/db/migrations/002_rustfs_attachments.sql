-- RustFS object storage support for attachments
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS storage_key TEXT,
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES case_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_comment ON attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_attachments_storage_key ON attachments(storage_key)
  WHERE storage_key IS NOT NULL;

-- Legacy metadata-only rows stay without storage_key; new uploads require it.
