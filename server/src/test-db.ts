import 'dotenv/config';
import supabase from './config/supabase';

async function test() {
  const { data, error } = await supabase.from('matches').select('*').limit(5);
  console.log('Error:', error);
  console.log('Matches:', data);
}

test();
