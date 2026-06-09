import Link from "next/link";

export default function MandiSelector({ state, mandis = [], mandiCounts = {}, totalRecords }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-3">
        {mandis.length} {mandis.length === 1 ? 'mandi' : 'mandis'} · {totalRecords?.toLocaleString('en-IN')} total records
      </p>
      {mandis.length === 0 ? (
        <p className="text-xs text-gray-300 py-4">No mandis found for this state</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {mandis.map((m) => (
            <Link
              key={m}
              href={`/?state=${encodeURIComponent(state)}&mandi=${encodeURIComponent(m)}`}
              className="bg-white border border-gray-100 rounded-lg px-3 py-2.5 hover:border-[#22863a] hover:shadow-sm transition-all group flex items-center justify-between gap-2"
            >
              <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#22863a] transition-colors">
                {m}
              </p>
              {mandiCounts[m] && (
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                  {mandiCounts[m]}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}