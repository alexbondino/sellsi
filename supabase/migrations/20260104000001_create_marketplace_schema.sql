-- =============================================================================
-- MIGRATION: Create Marketplace Schema
-- =============================================================================
-- Description: Creates the 'marketplace' schema if it does not already exist.
-- Date: 2026-01-04
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS marketplace;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA marketplace TO authenticated;
GRANT USAGE ON SCHEMA marketplace TO anon;

COMMENT ON SCHEMA marketplace IS 'Schema for marketplace-related tables and functions';
