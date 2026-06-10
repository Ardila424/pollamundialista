import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import matchRoutes from './routes/matches';
import predictionRoutes from './routes/predictions';
import leaderboardRoutes from './routes/leaderboard';
import syncRoutes from './routes/sync';
import { seedMatches } from './services/matchService';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- API Routes ----
// En Vercel, la ruta a veces incluye el prefijo completo si no se hace el rewrite correctamente.
// Usamos ambas por seguridad.
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matches/sync', syncRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/groups', require('./routes/groups').default);

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Arrancar servidor (Local) ----
async function start() {
  try {
    // Sembrar datos del Mundial si la BD está vacía
    await seedMatches();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏆 Polla Mundialista server corriendo en puerto ${PORT}`);
      console.log(`   Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  start();
}

export default app;
