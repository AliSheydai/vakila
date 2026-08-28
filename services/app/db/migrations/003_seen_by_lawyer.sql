-- Track when the lawyer has seen client-submitted comments and documents.
-- Clients may delete their own items only while seen_by_lawyer_at IS NULL.

ALTER TABLE case_comments
  ADD COLUMN IF NOT EXISTS seen_by_lawyer_at TIMESTAMPTZ;

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS seen_by_lawyer_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_case_comments_unseen_client
  ON case_comments(case_id)
  WHERE author_role = 'client' AND seen_by_lawyer_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_unseen_client
  ON attachments(case_id)
  WHERE comment_id IS NULL AND seen_by_lawyer_at IS NULL;
