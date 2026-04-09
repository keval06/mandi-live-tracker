export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-white border border-gray-100 rounded-lg px-5 py-5 mb-3 flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-100 rounded-full" />
          <div className="h-8 w-56 bg-gray-100 rounded" />
          <div className="h-3 w-72 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg px-8 py-5 w-24 h-16" />
          ))}
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 mb-3 flex gap-2">
        {[80,60,72,64,56,60].map((w,i) => (
          <div key={i} className="h-6 bg-gray-100 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* 3 price cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-3.5 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-1">
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-2.5 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-12 bg-gray-100 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(j => (
                <div key={j} className="space-y-1">
                  <div className="h-2 w-8 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="h-1 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart + sidebar */}
      <div className="grid grid-cols-[1fr_260px] gap-2 mb-3">
        <div className="space-y-2">
          <div className="bg-white border border-gray-100 rounded-lg p-3.5 h-48" />
          <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 h-14" />
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3.5 h-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        <div className="h-9 bg-gray-50 border-b border-gray-100" />
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="px-4 py-2.5 border-b border-gray-50 flex gap-4">
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
