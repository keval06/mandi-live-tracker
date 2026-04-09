import { formatRupee, priceBarPercent } from '@/lib/api/utils.js'

/**
 * PriceCard — matches design: crop name, mandi, min/modal/max, bar, badge
 *
 * Props:
 *   record — normalized record from lib/utils normalizeRecord()
 *   change — optional number (% change, positive or negative)
 */
export default function PriceCard({ record, change = null }) {
  const { commodity, market, state, minPrice, modalPrice, maxPrice, arrivalDate } = record

  const barPct  = priceBarPercent(modalPrice, minPrice, maxPrice)
  const isUp    = change !== null && change > 0
  const isDn    = change !== null && change < 0
  const barColor = isDn ? '#c0392b' : '#22863a'

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3.5">

      {/* Top row — crop + badge */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <p className="text-sm font-medium text-gray-900 leading-tight">{commodity}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{market}, {state}</p>
        </div>
        {change !== null && (
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
            isUp ? 'bg-green-50 text-green-700' :
            isDn ? 'bg-red-50 text-red-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {isUp ? '+' : ''}{change}%
          </span>
        )}
      </div>

      {/* Prices — min / modal / max */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Min</p>
          <p className="text-sm font-medium text-gray-800">{formatRupee(minPrice)}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Modal</p>
          <p className="text-sm font-medium text-[#22863a]">{formatRupee(modalPrice)}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Max</p>
          <p className="text-sm font-medium text-gray-800">{formatRupee(maxPrice)}</p>
        </div>
      </div>

      {/* Price position bar */}
      <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barPct}%`, backgroundColor: barColor }}
        />
      </div>

      <p className="text-[9px] text-gray-300 mt-1.5">per quintal · {arrivalDate}</p>
    </div>
  )
}
