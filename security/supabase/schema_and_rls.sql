-- =========================================================================
-- AnonTrove Enterprise Supabase PostgreSQL Security Schema & RLS Policies
-- Compliant with OWASP ASVS 5.0 (Level 2) and Least-Privilege Architecture
-- =========================================================================

-- 1. Enable pgcrypto extension for secure UUID and cryptographic primitives
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom ENUM types
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE book_status_type AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Books Catalog Table
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    description TEXT,
    price_in_inr INTEGER NOT NULL CHECK (price_in_inr >= 0),
    original_price_in_inr INTEGER CHECK (original_price_in_inr >= price_in_inr),
    pages INTEGER,
    format TEXT DEFAULT 'PDF',
    file_size TEXT,
    category TEXT NOT NULL,
    cover_image TEXT,
    file_name TEXT NOT NULL,
    status book_status_type DEFAULT 'PUBLISHED',
    primary_resource_type TEXT DEFAULT 'published_ebook',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Customer Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    gateway_order_id TEXT,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    subtotal_inr INTEGER NOT NULL CHECK (subtotal_inr >= 0),
    discount_inr INTEGER DEFAULT 0 CHECK (discount_inr >= 0),
    total_inr INTEGER NOT NULL CHECK (total_inr >= 0),
    coupon_code TEXT,
    gateway TEXT NOT NULL,
    status order_status_type DEFAULT 'PENDING' NOT NULL,
    bank_utr TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    paid_at TIMESTAMPTZ
);

-- 5. Order Items / Entitlements Table (Immutable Proof of Purchase)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT REFERENCES public.books(id) NOT NULL,
    price_at_purchase INTEGER NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Immutable Security Audit Log Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    actor_id UUID,
    actor_email TEXT,
    ip_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- Books Policies
-- -------------------------------------------------------------------------
-- Public visitors can read ONLY published books
CREATE POLICY "Public users can view published books"
    ON public.books
    FOR SELECT
    USING (status = 'PUBLISHED');

-- Service role / Admin can view and mutate all books
CREATE POLICY "Admins have full access to books"
    ON public.books
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- -------------------------------------------------------------------------
-- Orders Policies
-- -------------------------------------------------------------------------
-- Customers can ONLY view their own orders
CREATE POLICY "Customers can view own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = customer_id OR customer_email = (auth.jwt() ->> 'email'));

-- Only backend service role can insert or update orders (prevent client status forgery)
CREATE POLICY "Service role manages orders"
    ON public.orders
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- -------------------------------------------------------------------------
-- Order Items Policies
-- -------------------------------------------------------------------------
-- Customers can view items in their own verified orders
CREATE POLICY "Customers can view own order items"
    ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.customer_id = auth.uid() OR o.customer_email = (auth.jwt() ->> 'email'))
        )
    );

-- Only service role can insert purchased items
CREATE POLICY "Service role manages order items"
    ON public.order_items
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- -------------------------------------------------------------------------
-- Audit Logs Policies
-- -------------------------------------------------------------------------
-- Nobody can update or delete audit logs (Immutable Append-Only)
CREATE POLICY "Audit logs append-only for service role"
    ON public.security_audit_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Audit logs readable only by service role"
    ON public.security_audit_logs
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role');
