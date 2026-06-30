import supabase from '../config/supabase.js';

/**
 * Calcula y asigna puntos a todos los pronósticos de un partido finalizado.
 * Se invoca cuando un partido pasa a estado "Finalizado".
 *
 * Regla: Si el pronóstico coincide con el resultado real → 3 puntos, sino → 0 puntos.
 */
export async function scoreMatch(matchId: number): Promise<{
  success: boolean;
  scored: number;
  error?: string;
}> {
  // 1. Obtener el partido
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return { success: false, scored: 0, error: 'Partido no encontrado' };
  }

  if (match.status !== 'Finalizado') {
    return { success: false, scored: 0, error: 'El partido no ha finalizado' };
  }

  if (match.home_goals === null || match.away_goals === null) {
    return { success: false, scored: 0, error: 'Los goles del partido no están definidos' };
  }

  // 2. Determinar resultado real
  let realResult = '';
  if (match.phase === 'Grupos') {
    if (match.home_goals > match.away_goals) {
      realResult = 'Local';
    } else if (match.home_goals === match.away_goals) {
      realResult = 'Empate';
    } else {
      realResult = 'Visitante';
    }
  } else {
    // Fase eliminatoria
    const winner = match.winner || (match.home_goals > match.away_goals ? 'Local' : 'Visitante');
    const method = match.win_method || '120';
    realResult = `${winner}_${method}`;
  }

  // 3. Obtener todos los pronósticos de este partido
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId);

  if (predError) {
    return { success: false, scored: 0, error: `Error al obtener pronósticos: ${predError.message}` };
  }

  if (!predictions || predictions.length === 0) {
    return { success: true, scored: 0 };
  }

  // 4. Calcular y actualizar puntos para cada pronóstico en paralelo
  const updatePromises = predictions.map(async (pred) => {
    let points = 0;
    
    if (match.phase === 'Grupos') {
      points = pred.prediction === realResult ? 3 : 0;
    } else {
      // Fase eliminatoria
      if (pred.prediction && !pred.prediction.includes('_')) {
        // Regla antigua (compatibilidad con apuestas pasadas o no actualizadas)
        let oldRealResult: 'Local' | 'Empate' | 'Visitante';
        if (match.home_goals > match.away_goals) {
          oldRealResult = 'Local';
        } else if (match.home_goals === match.away_goals) {
          oldRealResult = 'Empate';
        } else {
          oldRealResult = 'Visitante';
        }
        points = pred.prediction === oldRealResult ? 3 : 0;
      } else {
        // Regla nueva (Ganador + Forma de victoria)
        const [predWinner, predMethod] = (pred.prediction || '').split('_');
        const [realWinner, realMethod] = realResult.split('_');

        if (predWinner && realWinner && predWinner === realWinner) {
          points += 2; // Acertó ganador
          if (predMethod && realMethod && predMethod === realMethod) {
            points += 1; // Acertó método (forma de ganar)
          }
        }
      }
    }

    const { error } = await supabase
      .from('predictions')
      .update({ points })
      .eq('id', pred.id);
      
    if (error) {
      console.error(`Error al actualizar puntos de predicción ${pred.id}:`, error.message);
      return false;
    }
    return true;
  });

  const results = await Promise.all(updatePromises);
  const scored = results.filter(r => r === true).length;

  console.log(
    `⚽ Partido ${matchId}: ${match.home_team} ${match.home_goals}-${match.away_goals} ${match.away_team} → Resultado: ${realResult}, ${scored} pronósticos puntuados`
  );

  return { success: true, scored };
}

/**
 * Recalcular puntos de TODOS los partidos finalizados.
 * Útil para corregir datos o reprocessar.
 */
export async function scoreAllFinishedMatches(): Promise<void> {
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'Finalizado');

  if (!matches) return;

  for (const match of matches) {
    await scoreMatch(match.id);
  }

  console.log(`✅ ${matches.length} partidos re-puntuados`);
}
