import 'dotenv/config';
import supabase from './config/supabase.js';

async function test() {
  const { data, error } = await supabase.from('matches').select('home_team, away_team');
  if (error) {
    console.error('Error:', error);
    return;
  }
  const teams = new Set<string>();
  (data || []).forEach(m => {
    teams.add(m.home_team);
    teams.add(m.away_team);
  });
  console.log(Array.from(teams).sort());
}

test();
