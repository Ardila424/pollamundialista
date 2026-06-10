import { Router } from 'express';
import { syncMatches } from '../services/matchSyncService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await syncMatches();
    if (result.success) {
      res.json({ message: 'Sincronización exitosa', count: result.count });
    } else {
      res.status(500).json({ error: 'Error en la sincronización', details: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
});

export default router;
