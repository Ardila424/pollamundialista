import 'dotenv/config';
import { syncMatches } from './services/matchSyncService.js';

async function test() {
  await syncMatches();
}
test();
