-- ==============================================================================
-- AnonTrove — Global Startup & Business Book Discovery Schema
-- Migration: 20261108_global_book_discovery_schema.sql
-- ==============================================================================

-- 1. Discovery Categories (25 Subject Domains)
CREATE TABLE IF NOT EXISTS public.discovery_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT DEFAULT 'BookOpen',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 25 Core Categories
INSERT INTO public.discovery_categories (name, slug, display_order)
VALUES
    ('Startups & Entrepreneurship', 'startups-entrepreneurship', 1),
    ('Small Business, Solopreneurship & Business Models', 'small-business-solopreneurship', 2),
    ('Innovation, Product Management & Design', 'innovation-product-design', 3),
    ('Business Strategy & Competitive Advantage', 'business-strategy', 4),
    ('Leadership & Executive Development', 'leadership-executive-development', 5),
    ('Management, Organization & Company Culture', 'management-organization-culture', 6),
    ('Marketing, Branding & Positioning', 'marketing-branding-positioning', 7),
    ('Copywriting, Advertising, Content & Growth', 'copywriting-advertising-growth', 8),
    ('Sales, Selling & Customer Acquisition', 'sales-customer-acquisition', 9),
    ('Negotiation, Communication & Influence', 'negotiation-communication-influence', 10),
    ('Business Finance, Accounting & Cash Flow', 'business-finance-accounting', 11),
    ('Investing, Markets & Capital Allocation', 'investing-markets-capital-allocation', 12),
    ('Personal Finance, Wealth & Financial Freedom', 'personal-finance-wealth', 13),
    ('Economics, Business History & Economic Systems', 'economics-business-history', 14),
    ('Psychology, Decision-Making & Behavioral Science', 'psychology-behavioral-science', 15),
    ('Productivity, Focus, Habits & Execution', 'productivity-habits-execution', 16),
    ('Operations, Process, Quality & Supply Chain', 'operations-process-supply-chain', 17),
    ('Technology, Digital Business, Software & AI', 'technology-software-ai', 18),
    ('Ecommerce, Retail, DTC & Digital Commerce', 'ecommerce-retail-dtc', 19),
    ('Customer Experience, Service & Customer Success', 'customer-experience-service', 20),
    ('Founder Biographies & Business Memoirs', 'founder-biographies-memoirs', 21),
    ('Corporate Case Studies, Business Stories & Failure', 'corporate-case-studies-failure', 22),
    ('Global Business, International Markets & Emerging Economies', 'global-business-emerging-markets', 23),
    ('Sustainability, Social Enterprise, Ethics & Impact', 'sustainability-social-enterprise', 24),
    ('Talent, Teams, Hiring & Workplace', 'talent-teams-hiring', 25)
ON CONFLICT (slug) DO NOTHING;

-- 2. Discovery Books (Global Business Bibliography)
CREATE TABLE IF NOT EXISTS public.discovery_books (
    id TEXT PRIMARY KEY,
    ref_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id INTEGER REFERENCES public.discovery_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    isbn13 TEXT,
    isbn10 TEXT,
    publisher TEXT,
    published_year TEXT,
    page_count INTEGER,
    language TEXT DEFAULT 'en',
    description TEXT,
    cover_url TEXT,
    rating REAL,
    review_count INTEGER,
    preview_url TEXT,
    openlibrary_work_id TEXT,
    google_volume_id TEXT,
    verification_status TEXT DEFAULT 'DISCOVERED' CHECK (verification_status IN ('VERIFIED', 'PARTIALLY_VERIFIED', 'DISCOVERED', 'FLAGGED')),
    provenance JSONB DEFAULT '{}'::jsonb,
    is_seed_book BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_books_slug ON public.discovery_books(slug);
CREATE INDEX IF NOT EXISTS idx_discovery_books_category ON public.discovery_books(category_id);
CREATE INDEX IF NOT EXISTS idx_discovery_books_isbn13 ON public.discovery_books(isbn13);
CREATE INDEX IF NOT EXISTS idx_discovery_books_author ON public.discovery_books(author);

-- 3. Discovery Audit Log
CREATE TABLE IF NOT EXISTS public.discovery_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT REFERENCES public.discovery_books(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT DEFAULT 'SYSTEM',
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.discovery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY public_read_discovery_categories ON public.discovery_categories FOR SELECT USING (true);
CREATE POLICY public_read_discovery_books ON public.discovery_books FOR SELECT USING (true);

-- Service role full control
CREATE POLICY service_role_all_discovery_books ON public.discovery_books FOR ALL USING (true);
CREATE POLICY service_role_all_discovery_audit ON public.discovery_audit_log FOR ALL USING (true);
