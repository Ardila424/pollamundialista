-- ============================================
-- Agregar columna has_paid a la tabla users
-- Ejecutar en Supabase SQL Editor
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;

-- Marcar como pagado a los usuarios de la lista inicial
UPDATE users 
SET has_paid = TRUE 
WHERE LOWER(username) IN ('santiago', 'admin', 'more', 'tetey', 'pablo zapata', 'juliansierra');
