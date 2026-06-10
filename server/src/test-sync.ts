import 'dotenv/config';
import { syncMatches } from './services/matchSyncService';

async function test() {
  await syncMatches();
}
test();
