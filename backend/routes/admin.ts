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

export default router;
