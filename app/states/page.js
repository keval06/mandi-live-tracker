
import { getAllStateTotals, getPricesByState } from '@/lib/api/mandi.js'
import { normalizeRecords, avgModalPrice, topCommoditiesByPrice, groupByState } from '@/lib/api/utils.js'
import PriceTable from '@/components/PriceTable'

export default async function StatesPage({ searchParams }) {
  const sp          = await searchParams
  const activeState = sp?.state || ''

  const stateTotals = await getAllStateTotals()

  let records = []
  if (activeState) {
    const { records: raw } = await getPricesByState(activeState)
    records = normalizeRecords(raw)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-lg font-medium text-gray-900 mb-1">State-wise prices</h1>
      <p className="text-xs text-gray-400 mb-4">{stateTotals.length} states reporting today</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-5">
        {stateTotals.map(s => (
          <a key={s.state}
            href={`/states?state=${encodeURIComponent(s.state)}`}
            className={`bg-white border rounded-lg p-3 hover:border-[#22863a] transition-colors ${
              activeState===s.state ? 'border-[#22863a] ring-1 ring-[#22863a]/20' : 'border-gray-100'
            }`}>
            <p className="text-xs font-medium text-gray-800 truncate">{s.state}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.total.toLocaleString('en-IN')} records</p>
          </a>
        ))}
      </div>

      {activeState && records.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-600 font-medium">{activeState}</span>
            <span className="text-[10px] text-gray-400">— {records.length} records</span>
            <a href="/states" className="text-[10px] text-gray-400 underline hover:text-gray-600 ml-2">Clear</a>
          </div>
          <PriceTable records={records} />
        </>
      )}

      {activeState && records.length === 0 && (
        <p className="text-xs text-gray-300 text-center py-8">No records for {activeState}</p>
      )}
    </div>
  )
}