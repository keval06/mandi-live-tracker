export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-12 py-6">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#22863a]" />
          <span>MandiTrack</span>
        </div>
        <span>Data from <a href="https://data.gov.in" className="underline hover:text-gray-600">data.gov.in</a></span>
        <span>Updated every 15 min</span>
      </div>
    </footer>
  )
}
