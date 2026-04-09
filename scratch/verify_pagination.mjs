// scratch/verify_pagination.mjs
import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
}

import { getPricesByState } from '../lib/api/mandi.js';

async function test() {
  console.log('--- Testing Pagination for Tamil Nadu ---');
  try {
    // This will use the current lib/api/mandi.js logic (BATCH=20)
    const result = await getPricesByState('Tamil Nadu');
    console.log(`Success!`);
    console.log(`Total reported by API: ${result.total}`);
    console.log(`Total records actually fetched: ${result.records.length}`);
    
    if (result.records.length > 10) {
      console.log('✅ Pagination is working! Fetched more than 10 records.');
    } else if (result.total > 10 && result.records.length === 10) {
      console.log('❌ Pagination failed. Only 10 records fetched despite higher total.');
    } else {
      console.log('ℹ️ Only 10 records exist for this state or results are small.');
    }
  } catch (error) {
    console.error('❌ Error during fetch:', error.message);
    if (error.message.includes('429')) {
      console.error('Hint: You are still hitting rate limits. Try reducing BATCH further (e.g., 5) and adding a delay.');
    }
  }
}

test();
