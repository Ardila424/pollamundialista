import { Router, Request, Response } from 'express';
import { getMatches, getMatchById, enrichMatchWithBetStatus, getPhases } from '../services/matchService';
import { getUserPredictionForMatch } from '../services/predictionService';
import { scoreMatch } from '../services/scoringService';
import { syncMatches } from '../services/matchSyncService';
import { authMiddleware } from '../middleware/auth';

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
      console.log('🔄 Ejecutando Lazy Syncing de partidos...');
      lastSyncTime = now; // Evitar que requests concurrentes disparen múltiples syncs
      try {
        await syncMatches();
      } catch (err) {
        console.error('Error en Lazy Sync:', err);
        lastSyncTime = 0; // Permitir reintento en el próximo request
      }
    }

    const matches = await getMatches({
      phase: phase as string | undefined,
      date: date as string | undefined,
      status: status as string | undefined,
    });

    // Enriquecer cada partido con el pronóstico del usuario
    const userId = req.user!.userId;
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const prediction = await getUserPredictionForMatch(userId, match.id);
        return enrichMatchWithBetStatus(
          match,
          prediction?.prediction,
          prediction?.points
        );
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

    const { default: supabase } = await import('../config/supabase');
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
