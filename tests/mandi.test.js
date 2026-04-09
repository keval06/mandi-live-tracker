// tests/mandi.test.js
import { readFileSync } from 'fs';
import { getPricesByState } from '../lib/api/mandi.js';

/**
 * MANDI TRACKER CORE LOGIC TEST SUITE
 * 
 * Run with: node tests/mandi.test.js
 */

// 1. Manually load environment variables from .env.local
try {
  const env = readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
  }
} catch (e) {
  console.error('❌ Could not read .env.local file. Make sure it exists.');
  process.exit(1);
}

async function runTest(state) {
  console.log(`\n🔍 TESTING STATE: ${state}`);
  console.log('--------------------------------------------------');
  
  const start = Date.now();
  try {
    const { records, total } = await getPricesByState(state);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`\n✅ TEST COMPLETED IN ${duration}s`);
    console.log(`📊 API Reported Total: ${total}`);
    console.log(`📥 Records Fetched:    ${records.length}`);

    if (records.length === total && total > 0) {
      console.log('✨ SUCCESS: All records fetched successfully!');
    } else if (records.length > 10) {
      console.log('🟡 PARTIAL SUCCESS: Fetched > 10 records, but some may be missing due to rate limits.');
    } else if (total > 0 && records.length === 10) {
      console.log('❌ FAILURE: Pagination stuck at 10 records.');
    } else if (total === 0) {
      console.log('❌ FAILURE: API returned 0 records (check for 429 block).');
    }

    if (records.length > 0) {
      console.log(`\n📋 SAMPLE DATA (First 2 records):`);
      console.table(records.slice(0, 2).map(r => ({
        Market: r.market,
        Commodity: r.commodity,
        Price: r.modal_price,
        Date: r.arrival_date
      })));
    }

  } catch (error) {
    console.error(`\n❌ CRITICAL ERROR: ${error.message}`);
  }
  console.log('--------------------------------------------------');
}

async function startSuite() {
  console.log('🚀 INITIALIZING MANDI TEST SUITE');
  
  // Test 1: Small State or state with known data (Gujarat is usually reliable)
  await runTest('Gujarat');

  // Test 2: Large State (Tamil Nadu) to verify batching/sleep logic
  await runTest('Tamil Nadu');
  
  console.log('\n🏁 ALL TESTS FINISHED.');
}

startSuite();
