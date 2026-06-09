'use client'
import { useState } from 'react'
import { formatRupee, formatDate } from '@/lib/api/utils.js'

// Category patterns — kept here so PriceTable is self-contained
const CATEGORY_PATTERNS = {
  Vegetables: /tomato|onion|potato|cabbage|capsicum|brinjal|cauliflower|carrot|bitter.?gourd|bhindi|ladies.?finger|bottle.?gourd|beans|beetroot|ridgeguard|tori|pumpkin|drumstick|spinach|cucumber/i,
  Cereals:    /wheat|maize|rice|barley|jowar|bajra|paddy|sorghum|ragi|millet/i,
  Pulses:     /gram|moong|arhar|tur|urad|masoor|lentil|peas|rajma|moth/i,
  Spices:     /garlic|ginger|turmeric|chilli|coriander|cumin|jeera|ajwan|pepper|cardamom|clove|fennel|fenugreek|methi/i,
  Fruits:     /apple|guava|orange|banana|mango|grape|pomegranate|papaya|watermelon|melon|lemon|lime|pineapple|pear|plum|peach|mousambi|sweet.?lime|karbuja|musk.?melon/i,
  Oilseeds:   /castor|mustard|groundnut|sunflower|soybean|sesamum|sesame|linseed|safflower|isabgul|soanf|suva|dill/i,
}

const CATEGORY_COLORS = {
  Vegetables: 'bg-green-50 text-green-700',
  Cereals:    'bg-yellow-50 text-yellow-700',
  Pulses:     'bg-orange-50 text-orange-700',
  Spices:     'bg-red-50 text-red-700',
  Fruits:     'bg-purple-50 text-purple-700',
  Oilseeds:   'bg-blue-50 text-blue-700',
  Other:      'bg-gray-100 text-gray-500',
}

function getCategory(commodity) {
  for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(commodity)) return cat
  }
  return 'Other'
}

// 8 columns now — added Category
const COLS = [
  { key: 'commodity',   label: 'Commodity'    },
  { key: 'category',    label: 'Category',  noSort: true },
  { key: 'market',      label: 'Mandi'        },
  { key: 'state',       label: 'State'        },
  { key: 'minPrice',    label: 'Min ₹/qtl'   },
  { key: 'modalPrice',  label: 'Modal ₹/qtl' },
  { key: 'maxPrice',    label: 'Max ₹/qtl'   },
  { key: 'arrivalDate', label: 'Date'         },
]

const GRID = 'grid grid-cols-[1.6fr_0.9fr_1.6fr_0.9fr_0.8fr_0.9fr_0.8fr_0.8fr]'

export default function PriceTable({ records = [] }) {
  const [sortKey, setSortKey] = useState('modalPrice')
  const [sortDir, setSortDir] = useState('desc')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [prevRecords, setPrevRecords] = useState(records)
  const PER_PAGE = 15

  // Automatically reset to page 1 whenever the server sends new filtered data 
  // (e.g. user completely switches Category or State from the FilterBar)
  if (records !== prevRecords) {
    setPage(1)
    setPrevRecords(records)
  }

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
  const pageStart  = (page - 1) * PER_PAGE + 1
  const pageEnd    = Math.min(page * PER_PAGE, sorted.length)

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
        {/* Issue 2 fix: show per-page range, not just total */}
        <span className="text-[10px] text-gray-400">
          {filtered.length > 0 ? `${pageStart}–${pageEnd} of ${filtered.length}` : '0 records'}
        </span>
      </div>

      {/* Header */}
      <div className={`${GRID} px-4 py-2 bg-gray-50 border-b border-gray-100`}>
        {COLS.map(c => (
          <button
            key={c.key}
            onClick={() => !c.noSort && toggleSort(c.key)}
            className={`text-[10px] text-gray-400 font-medium text-left flex items-center gap-1 transition-colors ${
              c.noSort ? 'cursor-default' : 'hover:text-gray-700'
            }`}
          >
            {c.label}
            {!c.noSort && sortKey === c.key && (
              <span className="text-[#22863a]">{sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {paged.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-gray-300">No records found</div>
      ) : paged.map((r, i) => {
        const cat = getCategory(r.commodity)
        return (
          <div
            key={i}
            className={`${GRID} px-4 py-2.5 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors last:border-0`}
          >
            <span className="text-xs font-medium text-gray-800 truncate pr-2">{r.commodity}</span>
            {/* Issue 1 fix: category badge */}
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full w-fit ${CATEGORY_COLORS[cat]}`}>
              {cat}
            </span>
            <span className="text-xs text-gray-500 truncate pr-2">{r.market}</span>
            <span className="text-xs text-gray-400 truncate">{r.state}</span>
            <span className="text-xs text-gray-600">{formatRupee(r.minPrice)}</span>
            <span className="text-xs font-medium text-[#22863a]">{formatRupee(r.modalPrice)}</span>
            <span className="text-xs text-gray-600">{formatRupee(r.maxPrice)}</span>
            <span className="text-[10px] text-gray-400">{formatDate(r.arrivalDate)}</span>
          </div>
        )
      })}

      {/* Pagination — Issue 2 fix: shows "showing X–Y of Z" */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            className="text-[10px] text-gray-400 disabled:opacity-30 hover:text-gray-700">← Prev</button>
          <span className="text-[10px] text-gray-400">
            Showing {pageStart}–{pageEnd} of {filtered.length} records
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
            className="text-[10px] text-gray-400 disabled:opacity-30 hover:text-gray-700">Next →</button>
        </div>
      )}
    </div>
  )
}