import 'dotenv/config';
import supabase from './config/supabase.js';

async function test() {
  const { data, error } = await supabase.from('matches').select('*').limit(5);
  console.log('Error:', error);
  console.log('Matches:', data);
}

test();
