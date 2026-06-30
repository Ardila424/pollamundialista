import { Router, Request, Response } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Lista de usuarios admin que pueden ver los logs (en minúsculas)
const ADMIN_USERS = ['tupi'];

/**
 * GET /api/logs
 * Obtener los logs de actividad de apuestas (solo admins).
 * Query params opcionales: ?limit=100&username=juancho
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar que el usuario es admin
    const currentUsername = req.user!.username.toLowerCase();
    if (!ADMIN_USERS.includes(currentUsername)) {
      res.status(403).json({ error: 'No tienes permisos para ver los logs' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);
    const filterUsername = (req.query.username as string)?.toLowerCase();

    // Obtener logs con datos de usuario y partido
    let query = supabase
      .from('prediction_logs')
      .select(`
        id,
        action,
        old_prediction,
        new_prediction,
        created_at,
        users:user_id ( id, username ),
        matches:match_id ( id, home_team, away_team, match_date, phase, group_name )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Si se filtra por usuario, necesitamos obtener su ID primero
    if (filterUsername) {
      const { data: filteredUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', filterUsername)
        .single();

      if (filteredUser) {
        query = query.eq('user_id', filteredUser.id);
      } else {
        res.json([]);
        return;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener logs:', error);
      res.status(500).json({ error: 'Error al obtener logs' });
      return;
    }

    // Formatear los logs para que sean fáciles de leer
    const formattedLogs = (data || []).map((log: any) => {
      const username = log.users?.username || 'Desconocido';
      const homeTeam = log.matches?.home_team || '?';
      const awayTeam = log.matches?.away_team || '?';
      const matchLabel = `${homeTeam} vs ${awayTeam}`;

      // Traducir predicción a texto legible
      const translatePrediction = (pred: string | null, match: any) => {
        if (!pred) return null;
        if (pred.startsWith('Local')) {
          const methodSuffix = pred.includes('_')
            ? ` (${pred.split('_')[1] === '120' ? '120 min' : 'Penales'})`
            : '';
          return `Gana: ${match?.home_team || '?'}${methodSuffix}`;
        }
        if (pred.startsWith('Visitante')) {
          const methodSuffix = pred.includes('_')
            ? ` (${pred.split('_')[1] === '120' ? '120 min' : 'Penales'})`
            : '';
          return `Gana: ${match?.away_team || '?'}${methodSuffix}`;
        }
        return 'Empate';
      };

      return {
        id: log.id,
        username,
        action: log.action,
        match: matchLabel,
        home_team: homeTeam,
        away_team: awayTeam,
        old_prediction_raw: log.old_prediction,
        new_prediction_raw: log.new_prediction,
        old_prediction: translatePrediction(log.old_prediction, log.matches),
        new_prediction: translatePrediction(log.new_prediction, log.matches),
        created_at: log.created_at,
      };
    });

    res.json(formattedLogs);
  } catch (err) {
    console.error('Error en GET /logs:', err);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

export default router;
