import { formatRupee } from '@/lib/api/utils.js'

/**
 * TopMovers — shows commodities with biggest price spread.
 * Server component — receives movers array from page.
 *
 * Props:
 *   movers — from getTopMovers() in lib/mandi.js
 */
export default function TopMovers({ movers = [] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3.5">
      <p className="text-xs font-medium text-gray-800 mb-3">Top movers today</p>

      {movers.length === 0 ? (
        <p className="text-xs text-gray-300">No data</p>
      ) : (
        <div className="flex flex-col gap-2">
          {movers.map(m => {
            const isHigh = m.spread >= 20
            return (
              <div key={m.commodity} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-800">{m.commodity}</p>
                  <p className="text-[9px] text-gray-400">
                    {formatRupee(m.minPrice)} – {formatRupee(m.maxPrice)}
                  </p>
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  isHigh
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {isHigh ? '+' : ''}{m.spread}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
