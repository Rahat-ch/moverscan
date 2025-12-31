'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { detectSearchType } from '@/lib/format'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const type = detectSearchType(trimmed)

    switch (type) {
      case 'address':
        router.push(`/?address=${trimmed}`)
        break
      case 'version':
        router.push(`/?tx=${trimmed}`)
        break
      case 'block':
        router.push(`/?block=${trimmed}`)
        break
      default:
        alert('Invalid search. Enter an address (0x...), transaction version, or block number.')
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Address / Tx Version / Block"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </form>
  )
}
