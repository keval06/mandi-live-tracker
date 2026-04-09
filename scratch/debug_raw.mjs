import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
let KEY;
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && k.trim() === 'DATA_GOV_API_KEY') KEY = v.join('=').trim();
}

const BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const url = `${BASE}?api-key=${KEY}&format=json&limit=1&offset=0&filters[state]=Arunachal Pradesh`;

console.log('Fetching:', url);
const res = await fetch(url);
console.log('Status:', res.status, res.statusText);
const text = await res.text();
console.log('Body snippet:', text.slice(0, 500));
try {
  const json = JSON.parse(text);
  console.log('Structure keys:', Object.keys(json));
  console.log('Total:', json.total);
  console.log('Count:', json.count);
} catch (e) {
  console.log('Failed to parse as JSON');
}
