import supabase from '../config/supabase.js';
import { scoreMatch } from './scoringService.js';

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

function cleanName(name: string | null | undefined): string {
  if (!name) return 'Por definir';
  return TEAM_TRANSLATIONS[name] || name;
}

export async function syncMatches() {
  console.log('🔄 Iniciando sincronización de partidos desde ESPN Scores...');

  try {
    // 1. Obtener los partidos actuales de la base de datos
    const { data: dbMatches, error: dbError } = await supabase.from('matches').select('*');
    if (dbError || !dbMatches) {
      throw new Error(`Error al obtener partidos de la BD: ${dbError?.message}`);
    }

    // 2. Determinar fechas a sincronizar
    const now = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    const datesToSync = new Set<string>();
    datesToSync.add(formatDate(now));

    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    datesToSync.add(formatDate(yesterday));

    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    datesToSync.add(formatDate(tomorrow));

    // Incluir fechas de partidos en progreso o cercanos en la BD
    for (const match of dbMatches) {
      const matchDate = new Date(match.match_date);
      if (match.status === 'En_Progreso') {
        datesToSync.add(formatDate(matchDate));
      }
      
      const diffTime = Math.abs(matchDate.getTime() - now.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (match.status === 'Pendiente' && diffDays <= 1.5) {
        datesToSync.add(formatDate(matchDate));
      }
    }

    console.log(`[ESPN Sync] Fechas a consultar: ${Array.from(datesToSync).join(', ')}`);

    // 3. Descargar scoreboards de ESPN
    const allEspnEvents: any[] = [];
    for (const dateStr of datesToSync) {
      const url = `https://www.espn.com/soccer/scoreboard?league=fifa.world&date=${dateStr}`;
      console.log(`[ESPN Sync] Consultando: ${url}`);
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.warn(`[ESPN Sync] Error HTTP para la fecha ${dateStr}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        if (!html || html.length === 0) {
          console.warn(`[ESPN Sync] HTML vacío para la fecha ${dateStr}`);
          continue;
        }
        
        const regex = /window\['__espnfitt__'\]\s*=\s*({[\s\S]*?});/i;
        const match = html.match(regex);
        if (!match) {
          console.warn(`[ESPN Sync] No se encontró el JSON __espnfitt__ para la fecha ${dateStr}`);
          continue;
        }
        
        const data = JSON.parse(match[1]);
        const gmsByLeague = data?.page?.content?.scoreboard?.gmsByLeague;
        if (!gmsByLeague || !Array.isArray(gmsByLeague)) {
          continue;
        }
        
        const wcLeague = gmsByLeague.find((l: any) => 
          l.league?.slug === 'fifa.world' || 
          l.league?.id === '606' || 
          l.league?.name === 'FIFA World Cup'
        );
        
        if (wcLeague && Array.isArray(wcLeague.evts)) {
          console.log(`[ESPN Sync] Encontrados ${wcLeague.evts.length} partidos para la fecha ${dateStr}`);
          allEspnEvents.push(...wcLeague.evts);
        }
      } catch (err: any) {
        console.error(`[ESPN Sync] Error procesando fecha ${dateStr}:`, err.message || err);
      }
    }

    console.log(`[ESPN Sync] Total de partidos recuperados de ESPN: ${allEspnEvents.length}`);

    let updatedCount = 0;

    // 4. Comparar y actualizar partidos
    for (const dbMatch of dbMatches) {
      const dbDateStr = new Date(dbMatch.match_date).toISOString().substring(0, 16);

      // Buscar el partido en los eventos de ESPN
      let isSwapped = false;
      const found = allEspnEvents.find((evt: any) => {
        const espnHome = evt.competitors?.find((c: any) => c.isHome);
        const espnAway = evt.competitors?.find((c: any) => !c.isHome);
        if (!espnHome || !espnAway) return false;

        const cleanHome = cleanName(espnHome.displayName);
        const cleanAway = cleanName(espnAway.displayName);
        const espnDateStr = new Date(evt.date).toISOString().substring(0, 16);

        if (dbMatch.phase === 'Grupos') {
          // Fase de grupos: comparar equipos traduciendo nombres (soporta intercambio)
          if (dbMatch.home_team === cleanHome && dbMatch.away_team === cleanAway) {
            isSwapped = false;
            return true;
          }
          if (dbMatch.home_team === cleanAway && dbMatch.away_team === cleanHome) {
            isSwapped = true;
            return true;
          }
          return false;
        } else {
          // Fase eliminatoria: comparar fecha y fase
          if (dbDateStr !== espnDateStr) return false;
          
          // Verificar si ya tienen nombres asignados en DB
          if (dbMatch.home_team !== 'Por definir' && dbMatch.away_team !== 'Por definir') {
            if (dbMatch.home_team === cleanAway || dbMatch.away_team === cleanHome) {
              isSwapped = true;
            }
          }
          return true;
        }
      });

      if (!found) {
        continue;
      }

      const espnHome = found.competitors?.find((c: any) => c.isHome);
      const espnAway = found.competitors?.find((c: any) => !c.isHome);

      // Mapear estado
      let status = 'Pendiente';
      if (found.status?.state === 'post') {
        status = 'Finalizado';
      } else if (found.status?.state === 'in') {
        status = 'En_Progreso';
      }

      // Mapear goles
      let homeGoals = dbMatch.home_goals;
      let awayGoals = dbMatch.away_goals;

      if (status === 'En_Progreso' || status === 'Finalizado') {
        const hScoreStr = espnHome?.score;
        const aScoreStr = espnAway?.score;
        
        if (hScoreStr !== undefined && hScoreStr !== null && aScoreStr !== undefined && aScoreStr !== null) {
          const hScore = parseInt(hScoreStr, 10);
          const aScore = parseInt(aScoreStr, 10);
          
          if (!isNaN(hScore) && !isNaN(aScore)) {
            if (isSwapped) {
              homeGoals = aScore;
              awayGoals = hScore;
            } else {
              homeGoals = hScore;
              awayGoals = aScore;
            }
          }
        }
      } else {
        homeGoals = null;
        awayGoals = null;
      }

      // Mapear nombres de equipos (útil para actualizar eliminatorias)
      const cleanHome = cleanName(espnHome?.displayName);
      const cleanAway = cleanName(espnAway?.displayName);
      
      let homeTeam = dbMatch.home_team;
      let awayTeam = dbMatch.away_team;

      if (dbMatch.home_team === 'Por definir' && cleanHome && cleanHome !== 'Por definir') {
        homeTeam = cleanHome;
      }
      if (dbMatch.away_team === 'Por definir' && cleanAway && cleanAway !== 'Por definir') {
        awayTeam = cleanAway;
      }

      // Verificar si hay cambios antes de hacer update para ahorrar escrituras en la base de datos
      const goalsChanged = homeGoals !== dbMatch.home_goals || awayGoals !== dbMatch.away_goals;
      const statusChanged = status !== dbMatch.status;
      const teamsChanged = homeTeam !== dbMatch.home_team || awayTeam !== dbMatch.away_team;

      if (goalsChanged || statusChanged || teamsChanged) {
        console.log(`[ESPN Sync] Actualizando partido ${dbMatch.id} (${homeTeam} vs ${awayTeam}): Goles ${homeGoals}-${awayGoals}, Estado ${status} (Antes: Goles ${dbMatch.home_goals}-${dbMatch.away_goals}, Estado ${dbMatch.status})`);
        
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
          
          // Si el estado acaba de cambiar a "Finalizado" o los goles del partido finalizado cambiaron, ejecutamos/recalculamos el scoringService
          if (status === 'Finalizado' && (dbMatch.status !== 'Finalizado' || goalsChanged)) {
             console.log(`⚡ Disparando cálculo de puntos para el partido finalizado: ${dbMatch.id}`);
             await scoreMatch(dbMatch.id);
          }
        } else {
          console.error(`[ESPN Sync] Error haciendo update del partido ${dbMatch.id}:`, updateError);
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
