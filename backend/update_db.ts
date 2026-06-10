import 'dotenv/config';
import supabase from './config/supabase.js';
import { worldCup2026Matches } from './data/worldcup2026.js';

async function run() {
  console.log('Actualizando partidos en Supabase...');
  
  for (const match of worldCup2026Matches) {
    const { error } = await supabase
      .from('matches')
      .update({
        home_team: match.home_team,
        away_team: match.away_team,
      })
      .eq('id', match.id);
      
    if (error) {
      console.error(`Error actualizando partido ${match.id}:`, error);
    }
  }
  
  console.log('✅ Partidos actualizados a nombres genéricos.');
}

run();
