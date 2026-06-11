import { Router, Request, Response } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { LeaderboardEntry } from '../types.js';

const router = Router();

// Lista de usuarios que ya pagaron (en minúsculas para evitar problemas)
// Puedes modificar esta lista manualmente con los usernames de quienes paguen.
const PAID_USERS = ['santiago', 'admin', 'more', 'tetey', 'pablo zapata', 'juliansierra'];

/**
 * GET /api/leaderboard
 * Ranking público de todos los usuarios ordenados por puntos acumulados.
 */
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');

    if (usersError) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }

    // Obtener todas las predicciones con puntos y pronóstico
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('user_id, points, prediction');

    if (predError) {
      res.status(500).json({ error: 'Error al obtener predicciones' });
      return;
    }

    // Calcular leaderboard
    const leaderboard: LeaderboardEntry[] = (users || []).map((user) => {
      const userPreds = (predictions || []).filter((p) => p.user_id === user.id);
      const scoredPreds = userPreds.filter((p) => p.points !== null);
      const correctPreds = scoredPreds.filter((p) => p.points === 3);

      return {
        id: user.id,
        username: user.username,
        total_points: scoredPreds.reduce((sum, p) => sum + (p.points || 0), 0),
        correct_predictions: correctPreds.length,
        total_predictions: userPreds.length,
        has_paid: PAID_USERS.includes(user.username.toLowerCase()),
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
