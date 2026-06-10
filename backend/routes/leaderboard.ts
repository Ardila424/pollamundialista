import { Router, Request, Response } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { LeaderboardEntry } from '../types.js';

const router = Router();

// Lista de usuarios que ya pagaron (en minúsculas para evitar problemas)
// Puedes modificar esta lista manualmente con los usernames de quienes paguen.
const PAID_USERS = ['santiago', 'admin', 'more', 'tetey'];

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
      // 1. El Nostradamus: El primer lugar (si tiene puntos)
      if (leaderboard[0].total_points > 0) {
        leaderboard[0].title = '🧙‍♂️ El Nostradamus';
      }

      // Buscar al "Salado" (0 puntos, más predicciones jugadas) y "El Tibio" (más empates apostados)
      let maxEmpates = 0;
      let tibioId: number | null = null;
      let minAccId: number | null = null;
      let maxJugadasSinAtinar = 0;

      for (const user of leaderboard) {
        // Ignorar a Nostradamus
        if (user.id === leaderboard[0].id && user.title) continue;

        const userPreds = (predictions || []).filter((p) => p.user_id === user.id);
        const scoredPreds = userPreds.filter((p) => p.points !== null);
        const empates = userPreds.filter((p) => p.prediction === 'Empate').length;

        // Regla para El Tibio: más empates
        if (empates >= 3 && empates > maxEmpates) {
          maxEmpates = empates;
          tibioId = user.id;
        }

        // Regla para El Salado: El que más ha jugado sin sumar 1 solo punto
        if (scoredPreds.length >= 3 && user.total_points === 0 && scoredPreds.length > maxJugadasSinAtinar) {
          maxJugadasSinAtinar = scoredPreds.length;
          minAccId = user.id;
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
    }

    res.json(leaderboard);
  } catch (err) {
    console.error('Error en GET /leaderboard:', err);
    res.status(500).json({ error: 'Error al obtener leaderboard' });
  }
});

export default router;
