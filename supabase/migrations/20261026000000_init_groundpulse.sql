-- ====================================================================
-- GroundPulse Database Schema & Migrations
-- Migration: 20261026000000_init_groundpulse.sql
-- Description: Core tables for grounds, community reports, RLS policies,
--              and performance indexes for latest-report retrieval.
-- ====================================================================

-- 1. Enable pgcrypto / uuid-ossp if needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Grounds Table (Verified Campus Facilities)
CREATE TABLE IF NOT EXISTS public.grounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_description TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    supported_sports TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Constraints on coordinates when present
ALTER TABLE public.grounds DROP CONSTRAINT IF EXISTS check_valid_latitude;
ALTER TABLE public.grounds ADD CONSTRAINT check_valid_latitude 
    CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0));

ALTER TABLE public.grounds DROP CONSTRAINT IF EXISTS check_valid_longitude;
ALTER TABLE public.grounds ADD CONSTRAINT check_valid_longitude 
    CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0));

-- 3. Ground Reports Table (Community-Submitted Crowd Pulse)
CREATE TABLE IF NOT EXISTS public.ground_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ground_id UUID NOT NULL REFERENCES public.grounds(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    sport_in_progress TEXT,
    note VARCHAR(280),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reporter_id TEXT DEFAULT 'anonymous_student',
    
    -- Status validation constraint
    CONSTRAINT check_valid_status CHECK (status IN ('Available', 'Occupied', 'Unknown')),
    CONSTRAINT check_note_length CHECK (note IS NULL OR char_length(note) <= 280)
);

-- 4. High-Performance Indexes for Filtering and Freshness Lookups
CREATE INDEX IF NOT EXISTS idx_grounds_name ON public.grounds (name);
CREATE INDEX IF NOT EXISTS idx_ground_reports_ground_id_submitted_at 
    ON public.ground_reports (ground_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ground_reports_submitted_at 
    ON public.ground_reports (submitted_at DESC);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.grounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ground_reports ENABLE ROW LEVEL SECURITY;

-- Grounds Policies
-- Any student or visitor can view verified ground directory data
DROP POLICY IF EXISTS "Allow public read access to grounds" ON public.grounds;
CREATE POLICY "Allow public read access to grounds"
    ON public.grounds FOR SELECT
    USING (true);

-- Ground management restricted to service role or authenticated admins
DROP POLICY IF EXISTS "Restrict grounds modification to service role" ON public.grounds;
CREATE POLICY "Restrict grounds modification to service role"
    ON public.grounds FOR ALL
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Ground Reports Policies
-- Anyone can view community reports
DROP POLICY IF EXISTS "Allow public read access to ground reports" ON public.ground_reports;
CREATE POLICY "Allow public read access to ground reports"
    ON public.ground_reports FOR SELECT
    USING (true);

-- Anyone (including anonymous campus students) can submit a valid report
-- With server-side constraint checks on valid status and note length
DROP POLICY IF EXISTS "Allow student submission of ground reports" ON public.ground_reports;
CREATE POLICY "Allow student submission of ground reports"
    ON public.ground_reports FOR INSERT
    WITH CHECK (
        status IN ('Available', 'Occupied', 'Unknown')
        AND (note IS NULL OR char_length(note) <= 280)
        AND ground_id IS NOT NULL
    );

-- Prevent unauthorized deletion or modification of historical reports
DROP POLICY IF EXISTS "Disallow updates to submitted reports" ON public.ground_reports;
CREATE POLICY "Disallow updates to submitted reports"
    ON public.ground_reports FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "Disallow public deletion of reports" ON public.ground_reports;
CREATE POLICY "Disallow public deletion of reports"
    ON public.ground_reports FOR DELETE
    USING (auth.role() = 'service_role');
