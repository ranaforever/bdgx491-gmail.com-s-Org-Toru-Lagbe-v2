-- ==============================================================================
-- TOUR LAGBE - COMPLETE SUPABASE DATABASE SCHEMA & REALTIME SETUP
-- Copy and paste this script directly into your Supabase SQL Editor and click RUN.
-- ==============================================================================

-- 1. BUS LAYOUT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.bus_layout_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bus_type TEXT,
  total_seats INTEGER DEFAULT 0,
  rows INTEGER DEFAULT 0,
  cols INTEGER DEFAULT 0,
  seats JSONB DEFAULT '[]'::jsonb,
  aisle_col INTEGER DEFAULT 2,
  has_driver BOOLEAN DEFAULT true,
  has_door BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT timezone('utc'::text, now())::text,
  updated_at TEXT DEFAULT timezone('utc'::text, now())::text
);

-- 2. TOURS & EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  tour_category TEXT DEFAULT 'Relax',
  start_date TEXT,
  end_date TEXT,
  fee NUMERIC DEFAULT 0,
  discount_allowed NUMERIC DEFAULT 0,
  bus_type TEXT,
  layout_template_id TEXT,
  total_seats INTEGER DEFAULT 0,
  hotel_id TEXT,
  agent_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Active',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TEXT DEFAULT timezone('utc'::text, now())::text
);

-- 3. HOTELS TABLE
CREATE TABLE IF NOT EXISTS public.hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  tour_id TEXT,
  check_in_date TEXT,
  check_out_date TEXT,
  total_rooms INTEGER DEFAULT 0,
  rooms JSONB DEFAULT '[]'::jsonb
);

-- 4. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  agency_name TEXT,
  phone TEXT,
  email TEXT DEFAULT '',
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Active'
);

-- 5. BOOKINGS TABLE (Supports Discount, Passenger Breakdown, and Payment Status)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  tour_id TEXT,
  agent_id TEXT,
  booker_code TEXT,
  agent_name TEXT DEFAULT '',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_alt_phone TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  customer_gender TEXT DEFAULT 'Male',
  customer_religion TEXT DEFAULT 'Islam',
  selected_seats JSONB DEFAULT '[]'::jsonb,
  group_type TEXT DEFAULT 'Single',
  group_id TEXT DEFAULT '',
  passenger_count INTEGER DEFAULT 1,
  passengers JSONB DEFAULT '[]'::jsonb,
  total_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  payable_amount NUMERIC DEFAULT 0,
  advance_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Unpaid',
  booking_status TEXT DEFAULT 'Confirmed',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT timezone('utc'::text, now())::text,
  updated_at TEXT DEFAULT timezone('utc'::text, now())::text
);

-- 6. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  business_name TEXT,
  tagline TEXT,
  logo_url TEXT DEFAULT '',
  phone TEXT,
  email TEXT,
  address TEXT,
  currency TEXT DEFAULT 'BDT',
  print_settings JSONB DEFAULT '{}'::jsonb
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & ALLOW PUBLIC ACCESS (FOR WEB & AGENT APP)
-- ==============================================================================
ALTER TABLE public.bus_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Public access to bus_layout_templates" ON public.bus_layout_templates;
DROP POLICY IF EXISTS "Public access to tours" ON public.tours;
DROP POLICY IF EXISTS "Public access to hotels" ON public.hotels;
DROP POLICY IF EXISTS "Public access to agents" ON public.agents;
DROP POLICY IF EXISTS "Public access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public access to system_settings" ON public.system_settings;

-- Create Open Access Policies for standard client access
CREATE POLICY "Public access to bus_layout_templates" ON public.bus_layout_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to tours" ON public.tours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to hotels" ON public.hotels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- REALTIME WEBSOCKET REPLICATION SETUP
-- Enables live sync for seat holding, instant booking updates, & live counters
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tours;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_layout_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
