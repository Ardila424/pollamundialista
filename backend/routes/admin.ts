import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const ADMIN_USERS = ['tupi'];

// Middleware local para validar que sea admin
const adminOnly = (req: Request, res: Response, next: () => void): void => {
  const username = req.user?.username?.toLowerCase() || '';
  if (!ADMIN_USERS.includes(username)) {
    res.status(403).json({ error: 'No tienes permisos de administrador' });
    return;
  }
  next();
};

/**
 * GET /api/admin/users
 * Lista todos los usuarios con su estado de pago. Solo admin.
 */
router.get('/users', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, has_paid, created_at')
      .order('username', { ascending: true });

    if (error) {
      res.status(500).json({ error: `Error al obtener usuarios: ${error.message}` });
      return;
    }

    res.json(users);
  } catch (err) {
    console.error('Error en GET /admin/users:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/admin/set-payment
 * Cambiar el estado de pago de un usuario. Solo admin.
 * Body: { userId: number, hasPaid: boolean }
 */
router.post('/set-payment', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, hasPaid } = req.body;

    if (userId === undefined || hasPaid === undefined) {
      res.status(400).json({ error: 'userId y hasPaid son requeridos' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ has_paid: !!hasPaid })
      .eq('id', userId);

    if (error) {
      res.status(500).json({ error: `Error al actualizar pago: ${error.message}` });
      return;
    }

    res.json({ message: 'Estado de pago actualizado correctamente' });
  } catch (err) {
    console.error('Error en POST /admin/set-payment:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/admin/reset-pin
 * Resetear el PIN de un usuario por su nombre. Solo admin.
 * Body: { username: string, newPin: string }
 */
router.post('/reset-pin', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, newPin } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'username es requerido y debe ser texto' });
      return;
    }

    if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'newPin es requerido y debe ser de exactamente 4 dígitos' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Buscar el usuario
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', cleanUsername)
      .single();

    if (findError || !user) {
      res.status(404).json({ error: `Usuario "${cleanUsername}" no encontrado` });
      return;
    }

    // Hashear el nuevo PIN
    const pinHash = await bcrypt.hash(newPin, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ pin_hash: pinHash })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({ error: `Error al actualizar PIN: ${updateError.message}` });
      return;
    }

    res.json({ message: `PIN del usuario "${user.username}" cambiado exitosamente` });
  } catch (err) {
    console.error('Error en POST /admin/reset-pin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/admin/match-audit/:matchId
 * Obtiene la auditoría de puntos para un partido específico. Solo admin.
 */
router.get('/match-audit/:matchId', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.matchId, 10);
    if (isNaN(matchId)) {
      res.status(400).json({ error: 'ID de partido inválido' });
      return;
    }

    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .order('username', { ascending: true });

    if (usersError) {
      res.status(500).json({ error: `Error al obtener usuarios: ${usersError.message}` });
      return;
    }

    // 2. Obtener todos los partidos ordenados por fecha y por ID
    const { data: allMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_goals, away_goals, status, match_date')
      .order('match_date', { ascending: true })
      .order('id', { ascending: true });

    if (matchesError) {
      res.status(500).json({ error: `Error al obtener partidos: ${matchesError.message}` });
      return;
    }

    // Buscar el partido objetivo
    const targetMatch = allMatches.find(m => m.id === matchId);
    if (!targetMatch) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    // Determinar la lista de partidos que jugaron antes cronológicamente
    const targetIndex = allMatches.findIndex(m => m.id === matchId);
    const priorMatchIds = allMatches.slice(0, targetIndex).map(m => m.id);

    // 3. Obtener todas las predicciones de los partidos prioritarios y del partido objetivo (paginado para superar límite de 1000)
    const allRelevantMatchIds = [...priorMatchIds, matchId];
    let predictions: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: chunk, error: predError } = await supabase
        .from('predictions')
        .select('user_id, match_id, prediction, points')
        .in('match_id', allRelevantMatchIds)
        .range(from, from + limit - 1);

      if (predError) {
        res.status(500).json({ error: `Error al obtener predicciones: ${predError.message}` });
        return;
      }

      if (chunk && chunk.length > 0) {
        predictions = [...predictions, ...chunk];
        from += limit;
        if (chunk.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // 4. Calcular para cada usuario
    const auditUsers = users.map((user: any) => {
      // Predicciones de este usuario
      const userPreds = (predictions || []).filter((p: any) => p.user_id === user.id);
      
      // Predicción del partido actual
      const targetPred = userPreds.find((p: any) => p.match_id === matchId);
      
      // Calcular puntos acumulados antes
      const pointsBefore = userPreds
        .filter((p: any) => p.match_id !== matchId && p.points !== null)
        .reduce((sum: number, p: any) => sum + (p.points || 0), 0);
      
      const earnedPoints = targetPred && targetPred.points !== null ? targetPred.points : null;
      const pointsAfter = pointsBefore + (earnedPoints ?? 0);

      return {
        userId: user.id,
        username: user.username,
        prediction: targetPred ? targetPred.prediction : null,
        earnedPoints,
        pointsBefore,
        pointsAfter,
      };
    });

    res.json({
      match: targetMatch,
      users: auditUsers,
    });
  } catch (err) {
    console.error('Error en GET /admin/match-audit/:matchId:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

