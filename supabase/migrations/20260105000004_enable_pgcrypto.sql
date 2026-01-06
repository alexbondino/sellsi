-- ========================================
-- MIGRACIÓN: Habilitar extensión pgcrypto
-- Fecha: 2026-01-05
-- Propósito: Habilitar bcrypt para hashing de contraseñas
-- ========================================

-- Habilitar extensión pgcrypto para funciones crypt() y gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Comentario
COMMENT ON EXTENSION pgcrypto IS 'Extensión para funciones criptográficas incluyendo bcrypt (crypt, gen_salt)';
