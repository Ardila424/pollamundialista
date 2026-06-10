import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

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

export default router;
