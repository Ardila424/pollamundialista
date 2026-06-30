import { Router, Request, Response } from 'express';
import { savePrediction, getUserPredictions, deletePrediction } from '../services/predictionService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/predictions
 * Guardar o actualizar un pronóstico.
 * Validación de 2 horas se hace en el servicio (server-side).
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId, prediction } = req.body;
    const userId = req.user!.userId;

    // Validar input
    if (!matchId || typeof matchId !== 'number') {
      res.status(400).json({ error: 'matchId es requerido y debe ser un número' });
      return;
    }

    const validPredictions = [
      'Local', 'Empate', 'Visitante', 
      'Local_120', 'Local_Penales', 
      'Visitante_120', 'Visitante_Penales'
    ];
    if (!prediction || !validPredictions.includes(prediction)) {
      res.status(400).json({
        error: 'prediction debe ser "Local", "Empate", "Visitante" o formato de fase eliminatoria (ej. "Local_120")',
      });
      return;
    }

    const result = await savePrediction(userId, matchId, prediction);

    if (!result.success) {
      res.status(403).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Pronóstico guardado correctamente',
      prediction: result.prediction,
    });
  } catch (err) {
    console.error('Error en POST /predictions:', err);
    res.status(500).json({ error: 'Error al guardar pronóstico' });
  }
});

/**
 * DELETE /api/predictions/:matchId
 * Eliminar un pronóstico.
 */
router.delete('/:matchId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.matchId as string, 10);
    const userId = req.user!.userId;

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'matchId inválido' });
      return;
    }

    const result = await deletePrediction(userId, matchId);

    if (!result.success) {
      res.status(403).json({ error: result.error });
      return;
    }

    res.json({ message: 'Pronóstico eliminado correctamente' });
  } catch (err) {
    console.error('Error en DELETE /predictions:', err);
    res.status(500).json({ error: 'Error al eliminar pronóstico' });
  }
});

/**
 * GET /api/predictions/me
 * Obtener todos los pronósticos del usuario autenticado.
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const predictions = await getUserPredictions(userId);

    // Calcular estadísticas
    const finished = predictions.filter((p) => p.points !== null);
    const correct = finished.filter((p) => p.points === 3);

    res.json({
      predictions,
      stats: {
        total: predictions.length,
        finished: finished.length,
        correct: correct.length,
        points: finished.reduce((sum, p) => sum + (p.points || 0), 0),
        accuracy: finished.length > 0
          ? Math.round((correct.length / finished.length) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error('Error en GET /predictions/me:', err);
    res.status(500).json({ error: 'Error al obtener pronósticos' });
  }
});

export default router;
