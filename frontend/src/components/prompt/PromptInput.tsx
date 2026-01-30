'use client'

import { useState, KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useConversationStore } from '@/store/conversationStore'
import { createPrompt } from '@/lib/api'

interface PromptInputProps {
  onSend?: () => void
}

export function PromptInput({ onSend }: PromptInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { model, temperature, maxTokens } = useSettingsStore()
  const { addMessage } = useConversationStore()

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message immediately
    addMessage({
      role: 'user',
      content: userMessage,
      model,
    })

    setIsLoading(true)
    onSend?.()

    try {
      // Generate response
      const response = await createPrompt({
        prompt: userMessage,
        model,
        temperature,
        maxTokens,
      })

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: response.response,
        model: response.model,
      })
    } catch (error) {
      console.error('Failed to generate response:', error)
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error generating a response. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything... (Cmd/Ctrl + Enter to send)"
          className="min-h-[120px] resize-none pr-12"
          disabled={isLoading}
        />
        <div className="absolute bottom-3 right-3">
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Press Cmd/Ctrl + Enter to send, Enter for new line
      </p>
    </div>
  )
}
