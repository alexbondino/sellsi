-- ============================================================================
-- MIGRATION: Add Feature Flag for My Financing
-- ============================================================================
-- Fecha: 2026-01-09
-- Descripción: Agrega feature flag para controlar la visibilidad del módulo
--              de financiamiento en la aplicación
-- ============================================================================

begin;

-- Insertar feature flag para financiamiento
insert into control_panel.feature_flags (workspace, key, label, description, enabled)
values
  ('my-financing', 'financing_enabled', 'Financing Module', 'Habilita o deshabilita el módulo de financiamiento para compradores (Mis Financiamientos)', true)
on conflict (workspace, key) do nothing;

commit;
