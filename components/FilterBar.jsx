'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['All Crops','Vegetables','Cereals','Pulses','Spices','Fruits']
const RANGES     = ['Today','This Week','Monthly']

export default function FilterBar({ states=[], activeState, activeCategory, activeRange }) {
  const router = useRouter()
  const sp     = useSearchParams()

  function push(key, val) {
    const p = new URLSearchParams(sp.toString())
    if (val) p.set(key, val); else p.delete(key)
    router.push(`?${p.toString()}`)
  }

  const cat   = activeCategory || 'All Crops'
  const range = activeRange    || 'This Week'
  const state = activeState    || ''

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-2 flex-wrap text-xs mb-3">

      <span className="text-gray-400 shrink-0">Category:</span>
      {CATEGORIES.map(c => (
        <button key={c} onClick={() => push('category', c==='All Crops'?'':c)}
          className={`px-3 py-1 rounded-full border transition-colors shrink-0 ${
            cat===c ? 'bg-[#22863a] text-white border-[#22863a]'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
          }`}>{c}</button>
      ))}

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <span className="text-gray-400 shrink-0">State:</span>
      <select value={state} onChange={e => push('state', e.target.value)}
        className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-gray-50 text-gray-600 outline-none cursor-pointer">
        <option value="">— pick state —</option>
        {states.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <span className="text-gray-400 shrink-0">Period:</span>
      {RANGES.map(r => (
        <button key={r} onClick={() => push('range', r==='This Week'?'':r)}
          className={`px-3 py-1 rounded-full border transition-colors shrink-0 ${
            range===r ? 'bg-[#22863a] text-white border-[#22863a]'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
          }`}>{r}</button>
      ))}
    </div>
  )
}