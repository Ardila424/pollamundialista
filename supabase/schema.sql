-- ============================================
-- Polla Mundialista — Schema PostgreSQL
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Partidos
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  phase TEXT NOT NULL,
  group_name TEXT,
  home_goals INTEGER DEFAULT NULL,
  away_goals INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'Pendiente'
    CHECK (status IN ('Pendiente', 'En_Progreso', 'Finalizado'))
);

-- Tabla de Pronósticos
CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('Local', 'Empate', 'Visitante')),
  points INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);

-- Habilitar Row Level Security (el backend usa service_role key, que bypasea RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
