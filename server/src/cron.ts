import cron from 'node-cron';
import { syncMatches } from './services/matchSyncService';

/**
 * Inicia las tareas programadas (cron jobs) del servidor.
 * - Sincroniza partidos con la API externa cada 5 minutos.
 */
export function startCronJobs() {
  console.log('⏳ Iniciando Node-Cron jobs...');

  // Se ejecuta cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ [CRON] Ejecutando sincronización automática de partidos...');
    await syncMatches();
  });
}
