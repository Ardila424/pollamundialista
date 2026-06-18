import { Router, Request, Response } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { LeaderboardEntry } from '../types.js';

const router = Router();

/**
 * GET /api/leaderboard
 * Ranking público de todos los usuarios ordenados por puntos acumulados.
 */
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Obtener todos los usuarios con su estado de pago
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, has_paid');

    if (usersError) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }

    // Obtener todas las predicciones con puntos, pronóstico y fecha del partido paginando de 1000 en 1000
    let predictions: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error: predError } = await supabase
        .from('predictions')
        .select('user_id, points, prediction, matches ( match_date )')
        .range(from, from + limit - 1);

      if (predError) {
        res.status(500).json({ error: 'Error al obtener predicciones' });
        return;
      }

      if (data && data.length > 0) {
        predictions = predictions.concat(data);
        from += limit;
        if (data.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // Mapear predicciones con fecha de partido
    const predsWithDate = (predictions || []).map((p: any) => ({
      user_id: p.user_id,
      points: p.points,
      prediction: p.prediction,
      match_date: p.matches?.match_date ? new Date(p.matches.match_date).getTime() : 0,
    }));

    // Calcular leaderboard
    const leaderboard: (LeaderboardEntry & { streak?: 'fire' | 'ice' | null })[] = (users || []).map((user) => {
      const userPreds = predsWithDate.filter((p) => p.user_id === user.id);
      const scoredPreds = userPreds.filter((p) => p.points !== null);
      const correctPreds = scoredPreds.filter((p) => p.points === 3);

      // Calcular racha (streak)
      // Ordenamos las predicciones finalizadas por fecha descendente (más nueva primero)
      const sortedFinishedPreds = [...scoredPreds].sort((a, b) => b.match_date - a.match_date);
      
      let streak: 'fire' | 'ice' | null = null;
      if (sortedFinishedPreds.length >= 3) {
        // Racha ganadora: las últimas 3 fueron aciertos (puntos === 3)
        let winStreak = 0;
        for (const p of sortedFinishedPreds) {
          if (p.points === 3) winStreak++;
          else break;
        }

        // Racha perdedora: las últimas 3 fueron errores (puntos === 0)
        let loseStreak = 0;
        for (const p of sortedFinishedPreds) {
          if (p.points === 0) loseStreak++;
          else break;
        }

        if (winStreak >= 3) streak = 'fire';
        else if (loseStreak >= 3) streak = 'ice';
      }

      return {
        id: user.id,
        username: user.username,
        total_points: scoredPreds.reduce((sum, p) => sum + (p.points || 0), 0),
        correct_predictions: correctPreds.length,
        total_predictions: userPreds.length,
        has_paid: !!user.has_paid,
        streak,
      };
    });

    // Ordenar por puntos (desc), luego por aciertos (desc)
    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.correct_predictions - a.correct_predictions;
    });

    // Asignar títulos divertidos
    if (leaderboard.length > 0) {
      // 1. 🧙‍♂️ El Nostradamus: Primer lugar (si tiene puntos)
      if (leaderboard[0].total_points > 0) {
        leaderboard[0].title = '🧙‍♂️ El Nostradamus';
      }

      // 2. 🥈 El Segundón: Segundo lugar (cerca pero no alcanza)
      if (leaderboard.length > 1 && leaderboard[1].total_points > 0) {
        if (!leaderboard[1].title) leaderboard[1].title = '🥈 El Segundón';
      }

      // 3. 💀 El Sótano: Último lugar (si tiene predicciones calificadas y puntos)
      const lastWithPreds = [...leaderboard].reverse().find(u => u.total_predictions > 0);
      if (lastWithPreds && lastWithPreds.id !== leaderboard[0].id && !lastWithPreds.title) {
        lastWithPreds.title = '💀 El Sótano';
      }

      // Buscar títulos basados en comportamiento
      let maxEmpates = 0;
      let tibioId: number | null = null;
      let minAccId: number | null = null;
      let maxJugadasSinAtinar = 0;
      let maxLocalPreds = 0;
      let localeroId: number | null = null;
      let maxTotalPreds = 0;
      let compulsivoId: number | null = null;
      let minTotalPreds = Infinity;
      let cobardeId: number | null = null;

      for (const user of leaderboard) {
        // Ignorar usuarios que ya tienen título
        if (user.title) continue;

        const userPreds = (predictions || []).filter((p) => p.user_id === user.id);
        const scoredPreds = userPreds.filter((p) => p.points !== null);
        const empates = userPreds.filter((p) => p.prediction === 'Empate').length;
        const locales = userPreds.filter((p) => p.prediction === 'Local').length;

        // 🤝 El Tibio: más empates apostados (mínimo 3)
        if (empates >= 3 && empates > maxEmpates) {
          maxEmpates = empates;
          tibioId = user.id;
        }

        // 🧂 El Salado: más ha jugado sin sumar ni 1 punto
        if (scoredPreds.length >= 3 && user.total_points === 0 && scoredPreds.length > maxJugadasSinAtinar) {
          maxJugadasSinAtinar = scoredPreds.length;
          minAccId = user.id;
        }

        // 🎮 El Jugador de FIFA: solo le apuesta al local (mínimo 4)
        if (locales >= 4 && locales > maxLocalPreds) {
          maxLocalPreds = locales;
          localeroId = user.id;
        }

        // 🎰 El Apostador Compulsivo: más apuestas totales (mínimo 5)
        if (userPreds.length >= 5 && userPreds.length > maxTotalPreds) {
          maxTotalPreds = userPreds.length;
          compulsivoId = user.id;
        }

        // 🐔 El Cobarde: menos apuestas de todos (al menos 1 para no ser vacío)
        if (userPreds.length >= 1 && userPreds.length < minTotalPreds) {
          minTotalPreds = userPreds.length;
          cobardeId = user.id;
        }
      }

      if (tibioId) {
        const tibio = leaderboard.find(u => u.id === tibioId);
        if (tibio && !tibio.title) tibio.title = '🤝 El Tibio';
      }
      if (minAccId) {
        const salado = leaderboard.find(u => u.id === minAccId);
        if (salado && !salado.title) salado.title = '🧂 El Salado';
      }
      if (localeroId) {
        const localero = leaderboard.find(u => u.id === localeroId);
        if (localero && !localero.title) localero.title = '🏠 El Local';
      }
      if (compulsivoId) {
        const compulsivo = leaderboard.find(u => u.id === compulsivoId);
        if (compulsivo && !compulsivo.title) compulsivo.title = '🎰 El Compulsivo';
      }
      if (cobardeId) {
        const cobarde = leaderboard.find(u => u.id === cobardeId);
        if (cobarde && !cobarde.title) cobarde.title = '🐔 El Cobarde';
      }
    }

    res.json(leaderboard);
  } catch (err) {
    console.error('Error en GET /leaderboard:', err);
    res.status(500).json({ error: 'Error al obtener leaderboard' });
  }
});

export default router;
