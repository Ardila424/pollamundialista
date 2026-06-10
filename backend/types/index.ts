// ============================================
// Tipos compartidos del servidor
// ============================================

export interface User {
  id: number;
  username: string;
  pin_hash: string;
  created_at: string;
}

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string | null;
  home_goals: number | null;
  away_goals: number | null;
  status: 'Pendiente' | 'En_Progreso' | 'Finalizado';
}

export interface Prediction {
  id: number;
  user_id: number;
  match_id: number;
  prediction: 'Local' | 'Empate' | 'Visitante';
  points: number | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
}

// Extiende Express Request para incluir usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface MatchWithBetStatus extends Match {
  is_open: boolean;
  time_remaining_ms: number | null;
  user_prediction?: string | null;
  user_points?: number | null;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  total_points: number;
  correct_predictions: number;
  total_predictions: number;
  title?: string;
  has_paid?: boolean;
}
