import { Router } from 'express';
import { getGroupStandings } from '../services/groupService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const standings = await getGroupStandings();
    res.json(standings);
  } catch (err: any) {
    console.error('Error en GET /groups:', err);
    res.status(500).json({ error: 'Error al obtener la tabla de posiciones de los grupos', details: err.message });
  }
});

export default router;
