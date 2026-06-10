import supabase from '../config/supabase.js';
import { scoreMatch } from './scoringService.js';

const EXTERNAL_WORLD_CUP_API_URL = process.env.EXTERNAL_WORLD_CUP_API_URL || 'https://worldcup26.ir';

export async function syncMatches() {
  console.log('🔄 Iniciando sincronización de partidos desde API externa...');
  try {
    const response = await fetch(`${EXTERNAL_WORLD_CUP_API_URL}/get/games`);
    if (!response.ok) {
      throw new Error(`Error en API externa: ${response.status} ${response.statusText}`);
    }
    
    const data = (await response.json()) as any;
    const games = data?.games;

    if (!Array.isArray(games)) {
      throw new Error('La respuesta de la API no contiene el array "games"');
    }

    let updatedCount = 0;
    
    // Obtener los partidos actuales para comparar estados
    const { data: existingMatches } = await supabase.from('matches').select('id, status');
    const existingMap = new Map((existingMatches || []).map(m => [m.id, m.status]));

    for (const game of games) {
      const matchId = parseInt(game.id, 10);
      if (isNaN(matchId)) continue;

      const homeGoals = game.home_score && game.home_score !== 'null' ? parseInt(game.home_score, 10) : null;
      const awayGoals = game.away_score && game.away_score !== 'null' ? parseInt(game.away_score, 10) : null;
      
      let status = 'Pendiente';
      if (game.finished === 'TRUE' || game.finished === true) {
        status = 'Finalizado';
      } else if (game.time_elapsed && game.time_elapsed !== 'notstarted') {
        status = 'En_Progreso';
      }

      // Mapeo de fase a los valores de nuestra DB
      let phase = 'Grupos';
      if (game.type === 'round of 32' || game.type === 'r32') phase = 'Treintaidosavos';
      else if (game.type === 'round of 16' || game.type === 'r16') phase = 'Octavos';
      else if (game.type === 'quarterfinal' || game.type === 'qf') phase = 'Cuartos';
      else if (game.type === 'semifinal' || game.type === 'sf') phase = 'Semifinal';
      else if (game.type === 'third place' || game.type === 'third') phase = 'Tercer Puesto';
      else if (game.type === 'final') phase = 'Final';

      let matchDate = new Date();
      if (game.local_date) {
        // Mapeo de stadium_id a su offset UTC en verano (junio/julio 2026)
        // 1, 2, 3 (México: CDMX, Guadalajara, Monterrey) -> CST (UTC-6)
        // 4, 5, 6 (Dallas, Houston, Kansas City) -> CDT (UTC-5)
        // 7, 8, 9, 10, 11, 12 (Eastern: Atlanta, Miami, Boston, Philly, NY/NJ, Toronto) -> EDT (UTC-4)
        // 13, 14, 15, 16 (Western: Vancouver, Seattle, SF, LA) -> PDT (UTC-7)
        let utcOffset = '-00:00';
        const stId = parseInt(game.stadium_id || '0', 10);
        if ([1, 2, 3].includes(stId)) utcOffset = '-06:00';
        else if ([4, 5, 6].includes(stId)) utcOffset = '-05:00';
        else if ([7, 8, 9, 10, 11, 12].includes(stId)) utcOffset = '-04:00';
        else if ([13, 14, 15, 16].includes(stId)) utcOffset = '-07:00';

        // Reemplazar espacios o slashes para estandarizar el formato ISO 8601: YYYY-MM-DDTHH:mm:00
        const [datePart, timePart] = game.local_date.split(' ');
        const [month, day, year] = datePart.split('/');
        matchDate = new Date(`${year}-${month}-${day}T${timePart}:00${utcOffset}`);
      }

      const TEAM_TRANSLATIONS: Record<string, string> = {
        'Mexico': 'México', 'Canada': 'Canadá', 'United States': 'Estados Unidos', 'South Africa': 'Sudáfrica',
        'Bosnia and Herzegovina': 'Bosnia', 'Haiti': 'Haití', 'Scotland': 'Escocia', 'Turkey': 'Turquía',
        'Türkiye': 'Turquía', 'Brazil': 'Brasil', 'Morocco': 'Marruecos', 'Ivory Coast': 'Costa de Marfil',
        'Cameroon': 'Camerún', 'Japan': 'Japón', 'Spain': 'España', 'South Korea': 'Corea del Sur',
        'England': 'Inglaterra', 'Saudi Arabia': 'Arabia Saudita', 'Netherlands': 'Países Bajos',
        'Italy': 'Italia', 'Belgium': 'Bélgica', 'Croatia': 'Croacia', 'Panama': 'Panamá',
        'Denmark': 'Dinamarca', 'Tunisia': 'Túnez', 'Switzerland': 'Suiza', 'Iran': 'Irán',
        'Poland': 'Polonia', 'Wales': 'Gales', 'Egypt': 'Egipto', 'Sweden': 'Suecia',
        'Czech Republic': 'Rep. Checa', 'Czechia': 'Rep. Checa', 'Ukraine': 'Ucrania', 'New Zealand': 'Nueva Zelanda',
        'Peru': 'Perú', 'Germany': 'Alemania', 'France': 'Francia', 'Jordan': 'Jordania', 'Austria': 'Austria',
        'Uzbekistan': 'Uzbekistán', 'Curaçao': 'Curazao', 'Cape Verde': 'Cabo Verde', 'Algeria': 'Argelia',
        'Democratic Republic of Congo': 'RD Congo', 'Iraq': 'Irak', 'Norway': 'Noruega'
      };

      const rawHome = game.home_team_name_en || game.home_team_label || 'Por definir';
      const rawAway = game.away_team_name_en || game.away_team_label || 'Por definir';

      const matchData = {
        id: matchId,
        home_team: TEAM_TRANSLATIONS[rawHome] || rawHome,
        away_team: TEAM_TRANSLATIONS[rawAway] || rawAway,
        match_date: matchDate.toISOString(),
        phase: phase,
        group_name: game.group && game.group !== 'null' ? game.group : null,
        home_goals: homeGoals,
        away_goals: awayGoals,
        status: status
      };

      const { error } = await supabase.from('matches').upsert(matchData);
      
      if (!error) {
        updatedCount++;
        
        // Si el estado acaba de cambiar a "Finalizado", ejecutamos el scoringService
        const oldStatus = existingMap.get(matchId);
        if (status === 'Finalizado' && oldStatus !== 'Finalizado') {
           console.log(`⚡ Disparando cálculo de puntos para el partido finalizado: ${matchId}`);
           await scoreMatch(matchId);
        }
      } else {
        console.error(`Error haciendo upsert del partido ${matchId}:`, error);
      }
    }

    console.log(`✅ Sincronización completa. Partidos procesados: ${updatedCount}`);
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error('❌ Error en sincronización:', error);
    return { success: false, error: error.message };
  }
}
