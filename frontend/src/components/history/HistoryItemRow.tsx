'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { HistoryItem } from '@/lib/api'

interface HistoryItemRowProps {
  item: HistoryItem
}

export function HistoryItemRow({ item }: HistoryItemRowProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer transition-colors hover:bg-accent"
        onClick={() => router.push(`/history/${item.id}`)}
      >
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            <span>•</span>
            <span>{item.model}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
