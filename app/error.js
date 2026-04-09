'use client'
export default function Error({ error, reset }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
      <div className="w-2 h-2 rounded-sm bg-red-400 mb-4" />
      <h2 className="text-sm font-medium text-gray-800 mb-1">Something went wrong</h2>
      <p className="text-xs text-gray-400 mb-5 max-w-sm">
        {error?.message || 'Failed to load mandi data. The API may be temporarily unavailable.'}
      </p>
      <button
        onClick={reset}
        className="text-xs bg-[#22863a] text-white px-4 py-1.5 rounded hover:bg-[#1a6b2e] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
