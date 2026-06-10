import supabase from '../config/supabase.js';
import { worldCup2026Matches } from '../data/worldcup2026.js';
import { Match, MatchWithBetStatus } from '../types.js';

const THIRTY_MINS_MS = 30 * 60 * 1000;

/**
 * Inicializa la tabla de partidos con datos del Mundial 2026
 * si aún no hay datos cargados.
 */
export async function seedMatches(): Promise<void> {
  const { count } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`✅ Tabla matches ya contiene ${count} registros`);
    return;
  }

  console.log('🌱 Sembrando datos del Mundial 2026...');

  const rows = worldCup2026Matches.map((m) => ({
    id: m.id,
    home_team: m.home_team,
    away_team: m.away_team,
    match_date: m.match_date,
    phase: m.phase,
    group_name: m.group_name,
    home_goals: null,
    away_goals: null,
    status: 'Pendiente',
  }));

  // Insertar en lotes de 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from('matches').insert(batch);
    if (error) {
      console.error('❌ Error al insertar partidos:', error.message);
      throw error;
    }
  }

  console.log(`✅ ${rows.length} partidos insertados correctamente`);
}

/**
 * Obtener todos los partidos con filtros opcionales
 */
export async function getMatches(filters: {
  phase?: string;
  date?: string;
  status?: string;
}): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true });

  if (filters.phase) {
    query = query.eq('phase', filters.phase);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.date) {
    // Filtrar por fecha (día completo en UTC)
    const startOfDay = `${filters.date}T00:00:00Z`;
    const endOfDay = `${filters.date}T23:59:59Z`;
    query = query.gte('match_date', startOfDay).lte('match_date', endOfDay);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener partidos: ${error.message}`);
  }

  return data as Match[];
}

/**
 * Obtener un partido por ID con estado de apuesta para el usuario
 */
export async function getMatchById(matchId: number): Promise<Match | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    return null;
  }

  return data as Match;
}

/**
 * Determina si un partido está abierto para apuestas
 */
export function isMatchOpenForBets(matchDate: string): boolean {
  const now = new Date();
  const cutoff = new Date(new Date(matchDate).getTime() - THIRTY_MINS_MS);
  return now < cutoff;
}

/**
 * Calcula el tiempo restante para apostar (ms)
 */
export function getTimeRemainingMs(matchDate: string): number | null {
  const now = new Date();
  const cutoff = new Date(new Date(matchDate).getTime() - THIRTY_MINS_MS);
  const remaining = cutoff.getTime() - now.getTime();
  return remaining > 0 ? remaining : null;
}

/**
 * Enriquece un partido con estado de apuesta
 */
export function enrichMatchWithBetStatus(
  match: Match,
  userPrediction?: string | null,
  userPoints?: number | null
): MatchWithBetStatus {
  return {
    ...match,
    is_open: isMatchOpenForBets(match.match_date),
    time_remaining_ms: getTimeRemainingMs(match.match_date),
    user_prediction: userPrediction ?? null,
    user_points: userPoints ?? null,
  };
}

/**
 * Obtener las fases únicas disponibles
 */
export async function getPhases(): Promise<string[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('phase')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener fases: ${error.message}`);
  }

  const uniquePhases = [...new Set((data as { phase: string }[]).map((m) => m.phase))];
  return uniquePhases;
}
