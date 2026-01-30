'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface HistorySearchProps {
  onSearch: (query: string) => void
}

export function HistorySearch({ onSearch }: HistorySearchProps) {
  const [query, setQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search history..."
        value={query}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  )
}
