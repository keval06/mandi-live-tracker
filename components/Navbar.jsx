'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',        label: 'Dashboard' },
  { href: '/compare', label: 'Compare'   },
  { href: '/states',  label: 'States'    },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-[#22863a]" />
          <span className="text-sm font-medium text-gray-900 tracking-tight">MandiTrack</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-xs transition-colors ${
                path === l.href
                  ? 'text-[#22863a] font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="text-xs bg-[#22863a] text-white px-3 py-1.5 rounded hover:bg-[#1a6b2e] transition-colors"
        >
          Set Alert
        </Link>
      </div>
    </nav>
  )
}
