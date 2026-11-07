-- ==============================================================================
-- SUPABASE POSTGRESQL 15 SCHEMA: ANON-TROVE ECOMMERCE & CUSTOMER LIBRARY
-- Row-Level Security (RLS) Enforced
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. BOOKS TABLE (Catalog cache in PostgreSQL)
-- ------------------------------------------------------------------------------
create table if not exists public.books (
    id uuid default uuid_generate_v4() primary key,
    slug text unique not null,
    title text not null,
    subtitle text,
    author text not null,
    category text not null,
    price numeric(10,2) not null,
    orig_price numeric(10,2),
    file_format text check (file_format in ('pdf', 'epub', 'mobi', 'bundle')),
    file_path text,
    cover_image text,
    page_count integer default 0,
    file_size_bytes bigint default 0,
    is_published boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;

create policy "Anyone can view published books"
    on public.books for select
    using (is_published = true);

-- ------------------------------------------------------------------------------
-- 3. ORDERS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete set null,
    customer_email text,
    gateway text check (gateway in ('famgateway', 'razorpay', 'cashfree', 'crypto')),
    gateway_order_id text,
    gateway_payment_id text,
    amount numeric(10,2) not null,
    currency text default 'INR',
    status text check (status in ('pending', 'completed', 'failed', 'refunded')) default 'pending',
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
    on public.orders for select
    using (auth.uid() = user_id or auth.jwt() ->> 'email' = customer_email);

-- ------------------------------------------------------------------------------
-- 4. ORDER ITEMS
-- ------------------------------------------------------------------------------
create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders on delete cascade not null,
    book_id uuid references public.books on delete set null,
    book_slug text not null,
    title text not null,
    price numeric(10,2) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.orders
            where orders.id = order_items.order_id
            and (orders.user_id = auth.uid() or orders.customer_email = auth.jwt() ->> 'email')
        )
    );

-- ------------------------------------------------------------------------------
-- 5. USER LIBRARY & PROGRESS TRACKER
-- ------------------------------------------------------------------------------
create table if not exists public.user_library (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    book_id uuid references public.books on delete cascade not null,
    order_id uuid references public.orders on delete set null,
    license_key text unique not null,
    reading_progress float default 0.0,
    current_page integer default 1,
    current_cfi text, -- for EPUB reader navigation
    bookmarks jsonb default '[]'::jsonb,
    highlights jsonb default '[]'::jsonb,
    last_accessed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, book_id)
);

alter table public.user_library enable row level security;

create policy "Users can view their own library items"
    on public.user_library for select
    using (auth.uid() = user_id);

create policy "Users can update their own library progress and bookmarks"
    on public.user_library for update
    using (auth.uid() = user_id);
