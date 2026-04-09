'use client'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { formatRupee } from '@/lib/api/utils.js'

const RANGES = ['7d', '30d', 'All']

/**
 * TrendChart
 *
 * Props:
 *   commodity — string
 *   data      — [{ date: "07/04/2026", avgPrice: 1800 }] sorted oldest→newest
 *               Built on server by grouping records by arrival_date.
 *               If only 1 date exists (today's data), shows per-mandi prices instead.
 *   perMandi  — [{ market, modalPrice }] — fallback when only 1 date
 */
export default function TrendChart({ commodity, data = [], perMandi = [] }) {
  const [range, setRange] = useState('All')

  // Decide what to render
  const isSingleDay = data.length <= 1

  const chartData = useMemo(() => {
    if (isSingleDay) {
      // Show per-mandi bar — X = market name (truncated), Y = modalPrice
      return perMandi
        .slice(0, 30)
        .map(m => ({
          date:     m.market.length > 18 ? m.market.slice(0, 18) + '…' : m.market,
          avgPrice: m.modalPrice,
        }))
    }
    // Multi-day: slice by range
    const days = range === '7d' ? 7 : range === '30d' ? 30 : data.length
    return data.slice(-days)
  }, [data, perMandi, isSingleDay, range])

  const avg = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.avgPrice, 0) / chartData.length)
    : 0

  const minY = chartData.length ? Math.min(...chartData.map(d => d.avgPrice)) : 0
  const maxY = chartData.length ? Math.max(...chartData.map(d => d.avgPrice)) : 0
  const yDomain = chartData.length
    ? [Math.floor(minY * 0.95), Math.ceil(maxY * 1.05)]
    : ['auto', 'auto']

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-800">
            {commodity} — {isSingleDay ? 'price across mandis' : 'price trend'}
          </p>
          <p className="text-[10px] text-gray-400">
            {isSingleDay
              ? `${perMandi.length} mandis reporting today`
              : `Avg modal price · ${chartData.length} data points`}
          </p>
        </div>
        {!isSingleDay && (
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  range === r ? 'bg-gray-100 text-gray-800 font-medium' : 'text-gray-400 hover:text-gray-600'
                }`}>{r}</button>
            ))}
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-xs text-gray-300">
          No data available for this commodity
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={isSingleDay ? Math.floor(chartData.length / 5) : 'preserveStartEnd'}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(1)+'K' : v}`}
              width={44}
            />
            <Tooltip
              formatter={val => [formatRupee(val), 'Modal price']}
              labelStyle={{ fontSize: 10, color: '#6b7280' }}
              contentStyle={{ fontSize: 11, border: '0.5px solid #e5e7eb', borderRadius: 6, boxShadow: 'none' }}
            />
            {!isSingleDay && (
              <ReferenceLine y={avg} stroke="#22863a" strokeDasharray="4 4" strokeOpacity={0.4} />
            )}
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#22863a"
              strokeWidth={1.5}
              dot={isSingleDay ? { r: 2, fill: '#22863a' } : false}
              activeDot={{ r: 3, fill: '#22863a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center justify-between mt-1">
        <p className="text-[9px] text-gray-300">per quintal (₹/qtl)</p>
        {chartData.length > 0 && (
          <p className="text-[9px] text-gray-400">avg {formatRupee(avg)}</p>
        )}
      </div>
    </div>
  )
}