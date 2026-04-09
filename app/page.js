import { Suspense }        from 'react'
import { getAllStateTotals, getPricesByState, getTopMovers, filterByRange } from '@/lib/api/mandi.js'
import { normalizeRecords, groupByCommodity, avgModalPrice } from '@/lib/api/utils.js'
import FilterBar  from '@/components/FilterBar'
import PriceCard  from '@/components/PriceCard'
import PriceTable from '@/components/PriceTable'
import TrendChart from '@/components/TrendChart'
import TopMovers  from '@/components/TopMovers'
import StateSelector from '@/components/StateSelector'

const CATEGORY_MAP = {
  Vegetables: ['Tomato','Onion','Potato','Cabbage','Capsicum','Ridgeguard(Tori)','Brinjal','Cauliflower','Carrot','Bitter gourd','Bhindi(Ladies Finger)','Bottle gourd','Beans','Beetroot'],
  Cereals:    ['Wheat','Maize','Rice','Barley','Jowar','Bajra','Paddy','Paddy(Common)','Bajra(Pearl Millet/Cumbu)','Barley(Jau)'],
  Pulses:     ['Gram','Moong','Arhar','Urad','Masoor','Lentil','Arhar(Tur/Red Gram)(Whole)','Black Gram(Urd Beans)(Whole)','Bengal Gram(Gram)(Whole)'],
  Spices:     ['Garlic','Ginger','Turmeric','Chilli','Coriander','Cumin','Cummin Seed(Jeera)','Ajwan'],
  Fruits:     ['Apple','Guava','Orange','Banana','Mango','Grapes','Pomegranate','Papaya','Banana - Green','Mango(Raw-Ripe)'],
}

function buildTrendData(records, commodity) {
  const byDate = {}
  for (const r of records) {
    if (r.commodity !== commodity) continue
    if (!byDate[r.arrivalDate]) byDate[r.arrivalDate] = []
    byDate[r.arrivalDate].push(r.modalPrice)
  }
  return Object.entries(byDate)
    .sort(([a],[b]) => {
      const ms = s => { const [d,m,y] = s.split('/'); return new Date(`${y}-${m}-${d}`).getTime() }
      return ms(a) - ms(b)
    })
    .map(([date, prices]) => ({
      date,
      avgPrice: Math.round(prices.reduce((s,p)=>s+p,0)/prices.length),
    }))
}

function buildPerMandi(records, commodity) {
  return records
    .filter(r => r.commodity === commodity && r.modalPrice > 0)
    .sort((a,b) => b.modalPrice - a.modalPrice)
    .map(r => ({ market: r.market, modalPrice: r.modalPrice }))
}

export default async function DashboardPage({ searchParams }) {
  const sp       = await searchParams
  const state    = sp?.state    || ''
  const category = sp?.category || ''
  const range    = sp?.range    || 'This Week'

  // Always fetch state list (parallel, cheap — 1 req per state)
  const stateTotals = await getAllStateTotals()
  const states      = stateTotals.map(s => s.state)
  const totalNation = stateTotals.reduce((s,st) => s+st.total, 0)

  // No state selected — show landing/state picker
  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero */}
        <div className="bg-white border border-gray-100 rounded-lg px-5 py-5 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-2.5 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22863a] animate-pulse" />
            <span className="text-[10px] text-[#22863a] font-medium">Live · data.gov.in · Updated daily</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">India Mandi Price Tracker</h1>
          <p className="text-xs text-gray-400 mb-4">
            {totalNation.toLocaleString('en-IN')} records across {states.length} states · Select a state to view prices
          </p>
        </div>

        {/* State grid */}
        <StateSelector stateTotals={stateTotals} />
      </div>
    )
  }

  // State selected — fetch all records for that state
  const [{ records: raw }, movers] = await Promise.all([
    getPricesByState(state),
    getTopMovers(state, 8),
  ])

  const rangeFiltered = filterByRange(raw, range)
  const records       = normalizeRecords(rangeFiltered)

  const filtered = category && CATEGORY_MAP[category]
    ? records.filter(r => CATEGORY_MAP[category].includes(r.commodity))
    : records

  const grouped    = groupByCommodity(filtered)
  const topEntries = Array.from(grouped.entries())
    .map(([commodity, recs]) => ({ commodity, avg: avgModalPrice(recs), recs }))
    .sort((a,b) => b.avg - a.avg)
    .slice(0, 3)

  const cardRecords    = topEntries.map(e => e.recs[0])
  const trendCommodity = topEntries[0]?.commodity ?? ''
  const trendData      = trendCommodity ? buildTrendData(records, trendCommodity) : []
  const perMandiData   = trendCommodity ? buildPerMandi(records, trendCommodity) : []

  const statInfo = stateTotals.find(s => s.state === state)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">

      {/* Hero */}
      <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 mb-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/" className="text-[10px] text-gray-400 hover:text-gray-600">← All states</a>
            <span className="text-gray-200">|</span>
            <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22863a] animate-pulse" />
              <span className="text-[10px] text-[#22863a] font-medium">Live</span>
            </div>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{state}</h1>
          <p className="text-xs text-gray-400">{statInfo?.total.toLocaleString('en-IN')} records · {records.length} shown</p>
        </div>
        <div className="flex gap-2">
          {[
            { val: new Set(records.map(r=>r.market)).size, label: 'Mandis' },
            { val: new Set(records.map(r=>r.commodity)).size, label: 'Commodities' },
            { val: records.length.toLocaleString('en-IN'), label: 'Records' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg px-3 py-2 text-right">
              <p className="text-base font-medium text-gray-900">{s.val}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <FilterBar
          states={states}
          activeState={state}
          activeCategory={category}
          activeRange={range}
        />
      </Suspense>

      {/* Top 3 cards */}
      {cardRecords.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {cardRecords.map((r,i) => <PriceCard key={i} record={r} />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg py-6 text-center text-xs text-gray-300 mb-3">
          No records for selected filters
        </div>
      )}

      {/* Chart + movers */}
      {trendCommodity && (
        <div className="grid grid-cols-[1fr_260px] gap-2 mb-3">
          <TrendChart commodity={trendCommodity} data={trendData} perMandi={perMandiData} />
          <TopMovers movers={movers} />
        </div>
      )}

      {/* Table */}
      <PriceTable records={filtered} />
    </div>
  )
}