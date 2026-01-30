'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { useMeetingQA } from '@/hooks/useMeetingQA'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { MeetingStatus } from '@/types/meeting'

interface QAPanelProps {
  meetingId: string | null
  status: MeetingStatus
}

interface QAMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ start?: number; end?: number; text: string }>
  timestamp: Date
}

function formatTime(seconds?: number): string {
  if (seconds === undefined) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function QAPanel({ meetingId, status }: QAPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<QAMessage[]>([])
  const qaMutation = useMeetingQA(meetingId)
  const isReady = status === 'READY'

  const handleSend = async () => {
    if (!input.trim() || !isReady || qaMutation.isPending) return

    const userMessage: QAMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await qaMutation.mutateAsync(userMessage.content)
      const assistantMessage: QAMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: QAMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : 'Failed to get answer. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask Questions</CardTitle>
        {!isReady && (
          <p className="text-sm text-muted-foreground">
            Q&A will be available when processing completes
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[500px] rounded-md border p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center py-12">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {isReady
                    ? 'Ask questions about this meeting'
                    : 'Processing must complete before Q&A is available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex flex-col gap-1 ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs text-muted-foreground">Sources:</p>
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border bg-background p-2 text-xs"
                            >
                              {source.start !== undefined && source.end !== undefined && (
                                <Badge variant="outline" className="mr-2">
                                  {formatTime(source.start)} - {formatTime(source.end)}
                                </Badge>
                              )}
                              <p className="mt-1 text-muted-foreground">{source.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground px-1">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {qaMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? 'Ask a question about this meeting... (Cmd/Ctrl + Enter to send)'
                : 'Q&A will be available when processing completes'
            }
            className="min-h-[100px] resize-none pr-12"
            disabled={!isReady || qaMutation.isPending}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !isReady || qaMutation.isPending}
              size="icon"
            >
              {qaMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
