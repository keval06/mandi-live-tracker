import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
      <span className="w-2 h-2 rounded-sm bg-gray-300 mb-4" />
      <h2 className="text-sm font-medium text-gray-800 mb-1">Page not found</h2>
      <p className="text-xs text-gray-400 mb-5">The page you are looking for does not exist.</p>
      <Link href="/" className="text-xs bg-[#22863a] text-white px-4 py-1.5 rounded hover:bg-[#1a6b2e] transition-colors">
        Back to dashboard
      </Link>
    </div>
  )
}
