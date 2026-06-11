import supabase from '../config/supabase.js';
import { scoreMatch } from './scoringService.js';

const FOOTBALL_DATA_API_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN;

const TEAM_TRANSLATIONS: Record<string, string> = {
  'Mexico': 'México', 'Canada': 'Canadá', 'United States': 'Estados Unidos', 'South Africa': 'Sudáfrica',
  'Bosnia and Herzegovina': 'Bosnia', 'Bosnia-Herzegovina': 'Bosnia', 'Haiti': 'Haití', 'Scotland': 'Escocia', 'Turkey': 'Turquía',
  'Türkiye': 'Turquía', 'Brazil': 'Brasil', 'Morocco': 'Marruecos', 'Ivory Coast': 'Costa de Marfil',
  'Cameroon': 'Camerún', 'Japan': 'Japón', 'Spain': 'España', 'South Korea': 'Corea del Sur',
  'Korea Republic': 'Corea del Sur', 'Czechia': 'Rep. Checa',
  'England': 'Inglaterra', 'Saudi Arabia': 'Arabia Saudita', 'Netherlands': 'Países Bajos',
  'Italy': 'Italia', 'Belgium': 'Bélgica', 'Croatia': 'Croacia', 'Panama': 'Panamá',
  'Denmark': 'Dinamarca', 'Tunisia': 'Túnez', 'Switzerland': 'Suiza', 'Iran': 'Irán',
  'Poland': 'Polonia', 'Wales': 'Gales', 'Egypt': 'Egipto', 'Sweden': 'Suecia',
  'Czech Republic': 'Rep. Checa', 'Ukraine': 'Ucrania', 'New Zealand': 'Nueva Zelanda',
  'Peru': 'Perú', 'Germany': 'Alemania', 'France': 'Francia', 'Jordan': 'Jordania', 'Austria': 'Austria',
  'Uzbekistan': 'Uzbekistán', 'Curaçao': 'Curazao', 'Cape Verde': 'Cabo Verde', 'Cape Verde Islands': 'Cabo Verde',
  'Algeria': 'Argelia', 'Democratic Republic of Congo': 'Democratic Republic of the Congo', 'Congo DR': 'Democratic Republic of the Congo', 'Iraq': 'Irak', 'Norway': 'Noruega',
  'Paraguay': 'Paraguay', 'Ecuador': 'Ecuador', 'Uruguay': 'Uruguay', 'Ghana': 'Ghana', 'Senegal': 'Senegal', 'Colombia': 'Colombia',
  'Australia': 'Australia', 'Qatar': 'Qatar'
};

const STAGE_MAP: Record<string, string> = {
  'GROUP_STAGE': 'Grupos',
  'LAST_32': 'Treintaidosavos',
  'LAST_16': 'Octavos',
  'QUARTER_FINALS': 'Cuartos',
  'SEMI_FINALS': 'Semifinal',
  'THIRD_PLACE': 'Tercer Puesto',
  'FINAL': 'Final'
};

function cleanName(name: string | null): string {
  if (!name) return 'Por definir';
  return TEAM_TRANSLATIONS[name] || name;
}

export async function syncMatches() {
  console.log('🔄 Iniciando sincronización de partidos desde football-data.org...');

  if (!FOOTBALL_DATA_API_TOKEN) {
    console.warn('⚠️ FOOTBALL_DATA_API_TOKEN no está configurado en las variables de entorno. Sincronización omitida.');
    return { success: false, error: 'API token not configured' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_API_TOKEN
        },
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('La API de football-data.org tardó demasiado en responder (timeout de 5s)');
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Error en API externa: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const fdMatches = data?.matches;

    if (!Array.isArray(fdMatches)) {
      throw new Error('La respuesta de la API no contiene el array "matches"');
    }

    // Obtener los partidos actuales de la base de datos
    const { data: dbMatches, error: dbError } = await supabase.from('matches').select('*');
    if (dbError || !dbMatches) {
      throw new Error(`Error al obtener partidos de la BD: ${dbError?.message}`);
    }

    let updatedCount = 0;

    for (const dbMatch of dbMatches) {
      const dbDateStr = new Date(dbMatch.match_date).toISOString().substring(0, 16);

      // Buscar el partido correspondiente en football-data.org
      const found = fdMatches.find((fd: any) => {
        const fdDateStr = new Date(fd.utcDate).toISOString().substring(0, 16);

        // Mapeo de fase/etapa
        const stage = STAGE_MAP[fd.stage];
        if (stage !== dbMatch.phase) return false;

        // Fase de grupos: comparar equipos traduciendo nombres
        if (dbMatch.phase === 'Grupos') {
          const dbHome = dbMatch.home_team;
          const dbAway = dbMatch.away_team;
          const fdHome = cleanName(fd.homeTeam.name);
          const fdAway = cleanName(fd.awayTeam.name);

          const homeMatches = dbHome === fdHome || 
            (dbHome === 'México' && fdHome === 'Mexico') || 
            (dbHome === 'Estados Unidos' && fdHome === 'United States') || 
            (dbHome === 'Canadá' && fdHome === 'Canada');
            
          const awayMatches = dbAway === fdAway || 
            (dbAway === 'México' && fdAway === 'Mexico') || 
            (dbAway === 'Estados Unidos' && fdAway === 'United States') || 
            (dbAway === 'Canadá' && fdAway === 'Canada');

          return homeMatches && awayMatches;
        } else {
          // Fase eliminatoria: comparar fecha y fase
          return fdDateStr === dbDateStr;
        }
      });

      if (!found) {
        continue;
      }

      // Mapear estado
      let status = 'Pendiente';
      if (found.status === 'FINISHED') {
        status = 'Finalizado';
      } else if (['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(found.status)) {
        status = 'En_Progreso';
      }

      // Mapear goles
      const homeGoals = found.score?.fullTime?.home !== null && found.score?.fullTime?.home !== undefined 
        ? found.score.fullTime.home 
        : null;
      const awayGoals = found.score?.fullTime?.away !== null && found.score?.fullTime?.away !== undefined 
        ? found.score.fullTime.away 
        : null;

      // Mapear nombres de equipos (útil para actualizar las llaves de eliminatorias cuando se definan)
      const homeTeam = cleanName(found.homeTeam.name) || dbMatch.home_team;
      const awayTeam = cleanName(found.awayTeam.name) || dbMatch.away_team;

      // Verificar si hay cambios antes de hacer update para ahorrar escrituras en la base de datos
      const goalsChanged = homeGoals !== dbMatch.home_goals || awayGoals !== dbMatch.away_goals;
      const statusChanged = status !== dbMatch.status;
      const teamsChanged = (homeTeam !== dbMatch.home_team && homeTeam !== 'Por definir') || 
                           (awayTeam !== dbMatch.away_team && awayTeam !== 'Por definir');

      if (goalsChanged || statusChanged || teamsChanged) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({
            home_team: homeTeam,
            away_team: awayTeam,
            home_goals: homeGoals,
            away_goals: awayGoals,
            status: status
          })
          .eq('id', dbMatch.id);

        if (!updateError) {
          updatedCount++;
          
          // Si el estado acaba de cambiar a "Finalizado", ejecutamos el scoringService
          if (status === 'Finalizado' && dbMatch.status !== 'Finalizado') {
             console.log(`⚡ Disparando cálculo de puntos para el partido finalizado: ${dbMatch.id}`);
             await scoreMatch(dbMatch.id);
          }
        } else {
          console.error(`Error haciendo update del partido ${dbMatch.id}:`, updateError);
        }
      }
    }

    console.log(`✅ Sincronización completa. Partidos actualizados: ${updatedCount}`);
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error('❌ Error en sincronización:', error);
    return { success: false, error: error.message };
  }
}
