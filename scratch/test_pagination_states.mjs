import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
let KEY;
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && k.trim() === 'DATA_GOV_API_KEY') KEY = v.join('=').trim();
}

const BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

async function check(state) {
  try {
    const params = new URLSearchParams({
      'api-key': KEY,
      format: 'json',
      limit: 10,
      offset: 0,
      'filters[state]': state
    });
    const url = `${BASE}?${params}`;
    console.log(`Checking ${state}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        console.error(`Error: ${res.status} ${res.statusText}`);
        return;
    }
    const j = await res.json();
    console.log(`${state}: total=${j.total}, count=${j.count}, records.length=${j.records?.length}`);
    if (j.records && j.records.length > 0) {
        console.log(`First record state: ${j.records[0].state}`);
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
    await check('Tamil Nadu');
    await check('Andhra Pradesh');
    await check('Gujarat');
}

run();
