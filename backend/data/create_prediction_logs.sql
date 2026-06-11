-- ============================================
-- Tabla de logs de actividad de apuestas
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS prediction_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  action TEXT NOT NULL CHECK (action IN ('NUEVA', 'ACTUALIZADA', 'ELIMINADA')),
  old_prediction TEXT,
  new_prediction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_prediction_logs_created_at ON prediction_logs(created_at DESC);

-- Índice para consultas por usuario
CREATE INDEX IF NOT EXISTS idx_prediction_logs_user_id ON prediction_logs(user_id);

-- Permitir al service_role leer/escribir (RLS desactivado para simplificar)
ALTER TABLE prediction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on prediction_logs"
  ON prediction_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
