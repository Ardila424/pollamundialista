import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

const ADMIN_USERS = ['tupi'];

/**
 * POST /api/auth/login
 * Login o registro automático con nombre de usuario y PIN de 4 dígitos.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, pin } = req.body;

    // Validaciones básicas
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      res.status(400).json({ error: 'El nombre de usuario debe tener al menos 2 caracteres' });
      return;
    }

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'El PIN debe ser exactamente 4 dígitos numéricos' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Buscar usuario existente
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanUsername)
      .single();

    if (existingUser) {
      // Usuario existe → validar PIN
      const pinMatch = await bcrypt.compare(pin, existingUser.pin_hash);

      if (!pinMatch) {
        res.status(401).json({ error: 'PIN incorrecto' });
        return;
      }

      // Login exitoso
      const token = signToken({
        userId: existingUser.id,
        username: existingUser.username,
      });

      res.json({
        token,
        user: { id: existingUser.id, username: existingUser.username },
        isNewUser: false,
      });
      return;
    }

    // Usuario no existe → crear automáticamente
    const pinHash = await bcrypt.hash(pin, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ username: cleanUsername, pin_hash: pinHash })
      .select()
      .single();

    if (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error al crear la cuenta' });
      return;
    }

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
    });

    res.status(201).json({
      token,
      user: { id: newUser.id, username: newUser.username },
      isNewUser: true,
    });
  } catch (err) {
    console.error('Error en /auth/login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/auth/reset-pin
 * Solo admin (tupi) puede resetear el PIN de otro usuario.
 * Body: { username: "juancho", newPin: "1234" }
 */
router.post('/reset-pin', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUsername = req.user!.username.toLowerCase();
    if (!ADMIN_USERS.includes(adminUsername)) {
      res.status(403).json({ error: 'No tienes permisos para resetear PINs' });
      return;
    }

    const { username, newPin } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'username es requerido' });
      return;
    }

    if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'newPin debe ser exactamente 4 dígitos' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Buscar usuario
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', cleanUsername)
      .single();

    if (!targetUser) {
      res.status(404).json({ error: `Usuario "${cleanUsername}" no encontrado` });
      return;
    }

    // Hashear el nuevo PIN y actualizar
    const newPinHash = await bcrypt.hash(newPin, 10);

    const { error } = await supabase
      .from('users')
      .update({ pin_hash: newPinHash })
      .eq('id', targetUser.id);

    if (error) {
      res.status(500).json({ error: 'Error al actualizar el PIN' });
      return;
    }

    res.json({ message: `PIN de "${targetUser.username}" reseteado exitosamente` });
  } catch (err) {
    console.error('Error en /auth/reset-pin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
