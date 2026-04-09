// Shows on landing page — pick a state to load its data
export default function StateSelector({ stateTotals = [] }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-3">
        Select a state to view prices
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {stateTotals.map(s => (
          <a
            key={s.state}
            href={`/?state=${encodeURIComponent(s.state)}`}
            className="bg-white border border-gray-100 rounded-lg p-3 hover:border-[#22863a] hover:shadow-sm transition-all group"
          >
            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#22863a] transition-colors">
              {s.state}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {s.total.toLocaleString('en-IN')} records
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}