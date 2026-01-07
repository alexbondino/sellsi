-- =============================================================================
-- MIGRATION: Initial Refresh of Products Daily Rank
-- =============================================================================
-- Description: Executes the first refresh of daily product rankings to
--              populate the marketplace.products_daily_rank table.
-- Date: 2026-01-04
-- =============================================================================

SELECT marketplace.refresh_products_daily_rank();
