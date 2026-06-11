import supabase from '../config/supabase.js';
import { Prediction } from '../types.js';
import { isMatchOpenForBets, getMatchById } from './matchService.js';

/**
 * Registra un log de actividad de apuestas en la tabla prediction_logs.
 * Se ejecuta en segundo plano (fire-and-forget) para no bloquear la respuesta.
 */
function logPredictionAction(
  userId: number,
  matchId: number,
  action: 'NUEVA' | 'ACTUALIZADA' | 'ELIMINADA',
  oldPrediction: string | null,
  newPrediction: string | null
): void {
  supabase
    .from('prediction_logs')
    .insert({
      user_id: userId,
      match_id: matchId,
      action,
      old_prediction: oldPrediction,
      new_prediction: newPrediction,
    })
    .then(({ error }) => {
      if (error) console.error('Error al registrar log de predicción:', error.message);
    });
}

/**
 * Guardar o actualizar un pronóstico.
 * Valida la regla de 2 horas antes del partido en el servidor.
 */
export async function savePrediction(
  userId: number,
  matchId: number,
  prediction: 'Local' | 'Empate' | 'Visitante'
): Promise<{ success: boolean; error?: string; prediction?: Prediction }> {
  // 1. Verificar que el partido existe
  const match = await getMatchById(matchId);
  if (!match) {
    return { success: false, error: 'Partido no encontrado' };
  }

  // 2. Verificar que el partido no ha finalizado
  if (match.status === 'Finalizado') {
    return { success: false, error: 'Este partido ya finalizó' };
  }

  if (match.status === 'En_Progreso') {
    return { success: false, error: 'Este partido ya está en progreso' };
  }

  // 3. REGLA CRÍTICA: Validar que faltan más de 2 horas (UTC)
  if (!isMatchOpenForBets(match.match_date)) {
    return {
      success: false,
      error: 'El tiempo para apostar ha expirado. Las apuestas se cierran 2 horas antes del partido.',
    };
  }

  // 4. Verificar si ya existe un pronóstico
  const { data: existing } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single();

  if (existing) {
    // Actualizar pronóstico existente
    const { data, error } = await supabase
      .from('predictions')
      .update({
        prediction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Error al actualizar: ${error.message}` };
    }

    // Log: apuesta actualizada
    logPredictionAction(userId, matchId, 'ACTUALIZADA', existing.prediction, prediction);

    return { success: true, prediction: data as Prediction };
  }

  // 5. Crear nuevo pronóstico
  const { data, error } = await supabase
    .from('predictions')
    .insert({
      user_id: userId,
      match_id: matchId,
      prediction,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar: ${error.message}` };
  }

  // Log: apuesta nueva
  logPredictionAction(userId, matchId, 'NUEVA', null, prediction);

  return { success: true, prediction: data as Prediction };
}

export async function deletePrediction(
  userId: number,
  matchId: number
): Promise<{ success: boolean; error?: string }> {
  // 1. Verificar que el partido existe y no ha finalizado/empezado
  const match = await getMatchById(matchId);
  if (!match) return { success: false, error: 'Partido no encontrado' };
  if (match.status === 'Finalizado') return { success: false, error: 'Este partido ya finalizó' };
  if (match.status === 'En_Progreso') return { success: false, error: 'Este partido ya está en progreso' };

  // Validar cutoff (misma regla que savePrediction)
  const isBetOpen = await import('./matchService.js').then(m => m.isMatchOpenForBets(match.match_date));
  if (!isBetOpen) {
    return { success: false, error: 'Ya pasó el límite de tiempo (30 min antes del pitazo inicial)' };
  }

  // Obtener la predicción actual antes de borrarla (para el log)
  const { data: currentPred } = await supabase
    .from('predictions')
    .select('prediction')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single();

  const { error } = await supabase
    .from('predictions')
    .delete()
    .match({ user_id: userId, match_id: matchId });

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  // Log: apuesta eliminada
  logPredictionAction(userId, matchId, 'ELIMINADA', currentPred?.prediction ?? null, null);

  return { success: true };
}

/**
 * Obtener todos los pronósticos de un usuario
 */
export async function getUserPredictions(userId: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      matches:match_id (
        id,
        home_team,
        away_team,
        match_date,
        phase,
        group_name,
        home_goals,
        away_goals,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener pronósticos: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtener el pronóstico de un usuario para un partido específico
 */
export async function getUserPredictionForMatch(
  userId: number,
  matchId: number
): Promise<Prediction | null> {
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single();

  return data as Prediction | null;
}
