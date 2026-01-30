'use client'

import { useConversationStore } from '@/store/conversationStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { useEffect, useRef } from 'react'

interface ResponsePanelProps {
  isLoading?: boolean
}

export function ResponsePanel({ isLoading }: ResponsePanelProps) {
  const { messages } = useConversationStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const element = scrollRef.current
        element.scrollTop = element.scrollHeight
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isLoading])

  return (
    <div className="rounded-lg border border-border bg-card h-[calc(100vh-300px)] overflow-hidden">
      <div className="h-full overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full min-h-[400px] items-center justify-center text-center">
              <div className="space-y-2">
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Enter a prompt above to begin chatting with AI
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && <TypingIndicator />}
        </div>
      </div>
    </div>
  )
}
