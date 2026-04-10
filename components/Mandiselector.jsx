// MandiSelector — shown after state is picked, before mandi is picked
// Clicking a mandi navigates to ?state=X&mandi=Y
export default function MandiSelector({ state, mandis = [], totalMandis }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-3">
        Select a mandi · showing {mandis.length} of{" "}
        {totalMandis?.toLocaleString("en-IN")} records
      </p>
      {mandis.length === 0 ? (
        <p className="text-xs text-gray-300 py-4">
          No mandis found for this state
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {mandis.map((m) => (
            <a
              key={m}
              href={`/?state=${encodeURIComponent(
                state
              )}&mandi=${encodeURIComponent(m)}`}
              className="bg-white border border-gray-100 rounded-lg p-3 hover:border-[#22863a] hover:shadow-sm transition-all group"
            >
              <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#22863a] transition-colors">
                {m}
              </p>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-300 mt-3">
        * Mandi list from first page only. More mandis available after
        selecting.
      </p>
    </div>
  );
}
