'use client'

import { useQuery } from '@tanstack/react-query'
import { getHistory } from '@/lib/api'
import { HistoryItemRow } from './HistoryItemRow'
import { HistorySearch } from './HistorySearch'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

export function HistoryList() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['history', searchQuery],
    queryFn: () => getHistory({ query: searchQuery, limit: 50 }),
  })

  return (
    <div className="space-y-4">
      <HistorySearch onSearch={setSearchQuery} />
      
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((item) => (
            <HistoryItemRow key={item.id} item={item} />
          ))
        ) : (
          <div className="flex h-64 items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium">No history found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search query' : 'Start a conversation to see history here'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
