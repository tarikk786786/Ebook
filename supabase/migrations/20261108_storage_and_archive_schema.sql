-- ==============================================================================
-- AnonTrove — Storage Architecture, Telegram Ingestion & Delivery Audit Schema
-- Migration: 20261108_storage_and_archive_schema.sql
-- ==============================================================================

-- 1. Storage Providers Table
CREATE TABLE IF NOT EXISTS public.storage_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('b2', 'r2', 's3', 'local')),
    endpoint TEXT,
    bucket TEXT NOT NULL,
    region TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default provider rows
INSERT INTO public.storage_providers (name, provider_type, endpoint, bucket, region, is_active)
VALUES 
    ('Backblaze B2 Primary Vault', 'b2', 'https://s3.us-east-005.backblazeb2.com', 'anontrove-private-vault', 'us-east-005', true),
    ('Local On-Premise Vault', 'local', NULL, 'private_storage', NULL, false)
ON CONFLICT DO NOTHING;

-- 2. Storage Objects (CAS - Content Addressable Storage)
CREATE TABLE IF NOT EXISTS public.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.storage_providers(id) ON DELETE RESTRICT,
    storage_key TEXT NOT NULL,
    bucket TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    etag TEXT,
    encryption_algorithm TEXT DEFAULT 'AES-256',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_sha256 ON public.storage_objects(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_storage_objects_key ON public.storage_objects(storage_key);

-- 3. Ebook Format Files
CREATE TABLE IF NOT EXISTS public.ebook_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL, -- references books.id or external catalog SKU
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE CASCADE,
    file_format TEXT NOT NULL CHECK (file_format IN ('pdf', 'epub', 'mobi', 'cbz', 'docx')),
    is_primary BOOLEAN DEFAULT true,
    page_count INTEGER,
    word_count INTEGER,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebook_files_book_id ON public.ebook_files(book_id);

-- 4. Ebook High-Res Covers
CREATE TABLE IF NOT EXISTS public.ebook_covers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL,
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE SET NULL,
    local_path TEXT,
    is_primary BOOLEAN DEFAULT true,
    width_px INTEGER,
    height_px INTEGER,
    format TEXT DEFAULT 'jpg',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebook_covers_book_id ON public.ebook_covers(book_id);

-- 5. Intellectual Property & Rights Management
CREATE TABLE IF NOT EXISTS public.ebook_rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL UNIQUE,
    rights_status TEXT NOT NULL DEFAULT 'COMMERCIAL' CHECK (rights_status IN ('PUBLIC_DOMAIN', 'CREATIVE_COMMONS', 'COMMERCIAL', 'DMCA_TAKEN_DOWN', 'PENDING_REVIEW')),
    license_name TEXT,
    rights_holder TEXT,
    verified BOOLEAN DEFAULT false,
    verified_by TEXT,
    audit_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Telegram Import Sources & Whitelist
CREATE TABLE IF NOT EXISTS public.import_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('telegram_channel', 'telegram_group', 'local_folder', 's3_bucket')),
    name TEXT NOT NULL,
    identifier TEXT NOT NULL UNIQUE, -- channel ID or username
    is_active BOOLEAN DEFAULT true,
    total_items_imported INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ingestion Jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.import_sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED')),
    items_found INTEGER DEFAULT 0,
    items_imported INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    items_errored INTEGER DEFAULT 0,
    error_log JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ingestion Items Record
CREATE TABLE IF NOT EXISTS public.import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    message_id BIGINT,
    title TEXT,
    author TEXT,
    original_file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash TEXT,
    format TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'DUPLICATE', 'SKIPPED', 'MALFORMED', 'REJECTED')),
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_items_sha256 ON public.import_items(sha256_hash);

-- 9. Download Audit Trail (Anti-forensic verification & replay prevention)
CREATE TABLE IF NOT EXISTS public.download_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    customer_email TEXT,
    ip_hash TEXT NOT NULL, -- SHA-256 hashed IP for GDPR/privacy compliance
    user_agent TEXT,
    token_hash TEXT NOT NULL,
    delivery_type TEXT DEFAULT 'S3_PRESIGNED_307' CHECK (delivery_type IN ('S3_PRESIGNED_307', 'LOCAL_STREAM', 'ERROR')),
    bytes_served BIGINT,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_events_order_id ON public.download_events(order_id);
CREATE INDEX IF NOT EXISTS idx_download_events_token_hash ON public.download_events(token_hash);

-- 10. Automated Backup & Replication Jobs
CREATE TABLE IF NOT EXISTS public.backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type TEXT NOT NULL CHECK (backup_type IN ('DATABASE_SQL', 'CATALOG_REGISTRY', 'VAULT_MIRROR_RCLONE', 'RESTIC_SNAPSHOT')),
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    destination TEXT NOT NULL,
    snapshot_id TEXT,
    total_bytes BIGINT DEFAULT 0,
    error_log TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_storage_providers') THEN
        CREATE POLICY service_role_all_storage_providers ON public.storage_providers FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_storage_objects') THEN
        CREATE POLICY service_role_all_storage_objects ON public.storage_objects FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_download_events') THEN
        CREATE POLICY service_role_all_download_events ON public.download_events FOR ALL USING (true);
    END IF;
END $$;
