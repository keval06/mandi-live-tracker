'use client'
import { useState } from 'react'
import { formatRupee, formatDate } from '@/lib/api/utils.js'

// COLS and GRID must match exactly — 7 columns, same order in header and rows
const COLS = [
  { key: 'commodity',   label: 'Commodity'    },
  { key: 'market',      label: 'Mandi'        },
  { key: 'state',       label: 'State'        },
  { key: 'minPrice',    label: 'Min ₹/qtl'   },
  { key: 'modalPrice',  label: 'Modal ₹/qtl' },
  { key: 'maxPrice',    label: 'Max ₹/qtl'   },
  { key: 'arrivalDate', label: 'Date'         },
]

// Grid: commodity wider, mandi wider, rest equal
const GRID = 'grid grid-cols-[1.8fr_1.8fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr]'

export default function PriceTable({ records = [] }) {
  const [sortKey, setSortKey] = useState('modalPrice')
  const [sortDir, setSortDir] = useState('desc')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const PER_PAGE = 15

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  const filtered = records.filter(r =>
    !search ||
    r.commodity.toLowerCase().includes(search.toLowerCase()) ||
    r.market.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const paged      = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">

      {/* Search bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search commodity, mandi or state…"
          className="flex-1 text-xs text-gray-700 outline-none placeholder:text-gray-300"
        />
        <span className="text-[10px] text-gray-400">{filtered.length} records</span>
      </div>

      {/* Header — same GRID as rows */}
      <div className={`${GRID} px-4 py-2 bg-gray-50 border-b border-gray-100`}>
        {COLS.map(c => (
          <button
            key={c.key}
            onClick={() => toggleSort(c.key)}
            className="text-[10px] text-gray-400 font-medium text-left flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            {c.label}
            {sortKey === c.key && (
              <span className="text-[#22863a]">{sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rows — same GRID as header */}
      {paged.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-gray-300">No records found</div>
      ) : paged.map((r, i) => (
        <div
          key={i}
          className={`${GRID} px-4 py-2.5 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors last:border-0`}
        >
          <span className="text-xs font-medium text-gray-800 truncate pr-2">{r.commodity}</span>
          <span className="text-xs text-gray-500 truncate pr-2">{r.market}</span>
          <span className="text-xs text-gray-400 truncate">{r.state}</span>
          <span className="text-xs text-gray-600">{formatRupee(r.minPrice)}</span>
          <span className="text-xs font-medium text-[#22863a]">{formatRupee(r.modalPrice)}</span>
          <span className="text-xs text-gray-600">{formatRupee(r.maxPrice)}</span>
          <span className="text-[10px] text-gray-400">{formatDate(r.arrivalDate)}</span>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            className="text-[10px] text-gray-400 disabled:opacity-30 hover:text-gray-700">← Prev</button>
          <span className="text-[10px] text-gray-400">{page} / {totalPages} · {filtered.length} records</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
            className="text-[10px] text-gray-400 disabled:opacity-30 hover:text-gray-700">Next →</button>
        </div>
      )}
    </div>
  )
}