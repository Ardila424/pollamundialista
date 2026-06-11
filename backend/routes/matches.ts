import { Router, Request, Response } from 'express';
import { getMatches, getMatchById, enrichMatchWithBetStatus, getPhases, isMatchOpenForBets } from '../services/matchService.js';
import { getUserPredictionForMatch } from '../services/predictionService.js';
import { scoreMatch } from '../services/scoringService.js';
import { syncMatches } from '../services/matchSyncService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Estado en memoria para Lazy Syncing
let lastSyncTime: number = 0;
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * GET /api/matches
 * Lista todos los partidos con filtros opcionales y estado de apuesta del usuario.
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phase, date, status } = req.query;

    // Lazy Syncing: Revisar si han pasado 30 minutos desde la última sincronización
    const now = Date.now();
    if (now - lastSyncTime > SYNC_INTERVAL_MS) {
      console.log('🔄 Sincronizando partidos...');
      lastSyncTime = now;
      try {
        await syncMatches();
      } catch (err) {
        console.error('Error en Lazy Sync:', err);
        lastSyncTime = 0;
      }
    }

    const matches = await getMatches({
      phase: phase as string | undefined,
      date: date as string | undefined,
      status: status as string | undefined,
    });

    // Cargar estadísticas de apuestas para todos los partidos en una sola consulta
    const { default: supabase } = await import('../config/supabase.js');
    const { data: allPredictions, error: predError } = await supabase
      .from('predictions')
      .select('match_id, prediction');

    const trendsMap: Record<number, { Local: number; Empate: number; Visitante: number; total: number }> = {};
    if (!predError && allPredictions) {
      allPredictions.forEach((p) => {
        const mId = p.match_id;
        const pred = p.prediction as 'Local' | 'Empate' | 'Visitante';
        if (!trendsMap[mId]) {
          trendsMap[mId] = { Local: 0, Empate: 0, Visitante: 0, total: 0 };
        }
        if (trendsMap[mId][pred] !== undefined) {
          trendsMap[mId][pred]++;
          trendsMap[mId].total++;
        }
      });
    }

    // Enriquecer cada partido con el pronóstico del usuario y tendencias
    const userId = req.user!.userId;
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const prediction = await getUserPredictionForMatch(userId, match.id);
        const enriched = enrichMatchWithBetStatus(
          match,
          prediction?.prediction,
          prediction?.points
        );

        const trends = trendsMap[match.id] || { Local: 0, Empate: 0, Visitante: 0, total: 0 };
        const total = trends.total;
        const prediction_trends = {
          Local: total > 0 ? Math.round((trends.Local / total) * 100) : 0,
          Empate: total > 0 ? Math.round((trends.Empate / total) * 100) : 0,
          Visitante: total > 0 ? Math.round((trends.Visitante / total) * 100) : 0,
          total_bets: total
        };

        return {
          ...enriched,
          prediction_trends
        };
      })
    );

    res.json(enrichedMatches);
  } catch (err) {
    console.error('Error en GET /matches:', err);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
});

/**
 * GET /api/matches/phases
 * Lista las fases únicas disponibles.
 */
router.get('/phases', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const phases = await getPhases();
    res.json(phases);
  } catch (err) {
    console.error('Error en GET /matches/phases:', err);
    res.status(500).json({ error: 'Error al obtener fases' });
  }
});

/**
 * GET /api/matches/:id
 * Detalle de un partido con estado de apuesta.
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.id as string, 10);

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'ID de partido inválido' });
      return;
    }

    const match = await getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const userId = req.user!.userId;
    const prediction = await getUserPredictionForMatch(userId, matchId);
    const enriched = enrichMatchWithBetStatus(
      match,
      prediction?.prediction,
      prediction?.points
    );

    res.json(enriched);
  } catch (err) {
    console.error('Error en GET /matches/:id:', err);
    res.status(500).json({ error: 'Error al obtener partido' });
  }
});

/**
 * GET /api/matches/:id/predictions
 * Obtiene las apuestas del grupo para un partido cerrado (menos de 5 min para iniciar o en vivo/finalizado).
 */
router.get('/:id/predictions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    if (isNaN(matchId)) {
      res.status(400).json({ error: 'ID de partido inválido' });
      return;
    }

    const match = await getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const isOpen = isMatchOpenForBets(match.match_date) && match.status === 'Pendiente';
    if (isOpen) {
      res.status(403).json({ error: 'Las apuestas aún están abiertas. No puedes ver los pronósticos de los demás todavía.' });
      return;
    }

    const { default: supabase } = await import('../config/supabase.js');
    const { data, error } = await supabase
      .from('predictions')
      .select('prediction, points, users ( username )')
      .eq('match_id', matchId);

    if (error) {
      res.status(500).json({ error: `Error al obtener predicciones: ${error.message}` });
      return;
    }

    const formatted = (data || []).map((p: any) => ({
      username: p.users?.username || 'Desconocido',
      prediction: p.prediction,
      points: p.points,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error en GET /matches/:id/predictions:', err);
    res.status(500).json({ error: 'Error al obtener predicciones del grupo' });
  }
});

/**
 * PATCH /api/matches/:id/result
 * Actualizar resultado de un partido (para uso vía script/admin).
 * En producción, los resultados se actualizan desde Supabase Dashboard.
 */
router.patch('/:id/result', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { home_goals, away_goals, status } = req.body;

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'ID de partido inválido' });
      return;
    }

    if (typeof home_goals !== 'number' || typeof away_goals !== 'number') {
      res.status(400).json({ error: 'Los goles deben ser números' });
      return;
    }

    const { default: supabase } = await import('../config/supabase.js');
    const { error } = await supabase
      .from('matches')
      .update({
        home_goals,
        away_goals,
        status: status || 'Finalizado',
      })
      .eq('id', matchId);

    if (error) {
      res.status(500).json({ error: `Error al actualizar: ${error.message}` });
      return;
    }

    // Si el partido se marcó como finalizado, calcular puntos
    if (status === 'Finalizado' || !status) {
      const result = await scoreMatch(matchId);
      res.json({
        message: 'Resultado actualizado y puntos calculados',
        scoring: result,
      });
      return;
    }

    res.json({ message: 'Resultado actualizado' });
  } catch (err) {
    console.error('Error en PATCH /matches/:id/result:', err);
    res.status(500).json({ error: 'Error al actualizar resultado' });
  }
});

export default router;
