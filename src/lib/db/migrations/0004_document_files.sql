-- ─────────────────────────────────────────────────────────────────────────────
-- 0004  real file attachments
--
-- Uploads were held as `URL.createObjectURL(file)` blob URLs: valid only for
-- the life of one page, so any "attached" file was gone on the next reload.
-- Every document recorded so far is a link, so nothing is lost by adding real
-- storage now — files land on disk under data/uploads and are served back
-- through /api/files.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE documents ADD COLUMN size_bytes INTEGER;
ALTER TABLE documents ADD COLUMN storage_path TEXT;

-- A blob: URL can never resolve again; treat any such row as a broken link.
UPDATE documents SET url = '' WHERE url LIKE 'blob:%';
