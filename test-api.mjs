#!/usr/bin/env node
// Run: node test-limit.mjs
import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}
const KEY  = process.env.DATA_GOV_API_KEY
const BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
const get  = async url => (await fetch(url)).json()

// TEST A: Does API ever respect a higher limit?
console.log('\n── Does API respect limit param? ──')
for (const lim of [10, 50, 100, 500, 1000]) {
  const j = await get(`${BASE}?api-key=${KEY}&format=json&limit=${lim}&offset=0`)
  console.log(`limit=${lim} sent → count=${j.count}, records.length=${j.records?.length}`)
}

// TEST B: State-by-state totals (to know how many requests needed per state)
console.log('\n── State totals (total records each) ──')
const STATES = [
  'Gujarat','Maharashtra','Punjab','Uttar Pradesh','Madhya Pradesh',
  'Rajasthan','Karnataka','Tamil Nadu','Andhra Pradesh','Telangana',
  'West Bengal','Bihar','Haryana','Himachal Pradesh','Odisha'
]
for (const state of STATES) {
  const j = await get(`${BASE}?api-key=${KEY}&format=json&limit=10&offset=0&filters[state]=${encodeURIComponent(state)}`)
  console.log(`${state}: total=${j.total}`)
}

// TEST C: Can we paginate a single state fully?
console.log('\n── Paginate Gujarat fully (total=906 → need 91 pages of 10) ──')
let all = [], offset = 0, pages = 0
while (true) {
  const j = await get(`${BASE}?api-key=${KEY}&format=json&limit=10&offset=${offset}&filters[state]=Gujarat`)
  const recs = j.records ?? []
  if (!recs.length) break
  all = [...all, ...recs]
  pages++
  offset += 10
  if (pages % 20 === 0) console.log(`  pages=${pages}, fetched=${all.length}`)
  if (pages > 200) { console.log('  stopping at 200 pages'); break } // safety
}
console.log(`Gujarat done: ${pages} pages, ${all.length} records`)
const states2 = [...new Set(all.map(r => r.state))]
console.log('states in result:', states2)
const crops = [...new Set(all.map(r => r.commodity))].sort()
console.log(`commodities (${crops.length}):`, crops.slice(0, 20))
