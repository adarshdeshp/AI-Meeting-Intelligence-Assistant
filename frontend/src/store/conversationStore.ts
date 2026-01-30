import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
}

interface ConversationState {
  messages: Message[]
  currentConversationId: string | null
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setMessages: (messages: Message[]) => void
  clearMessages: () => void
  setConversationId: (id: string | null) => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  currentConversationId: null,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [], currentConversationId: null }),
  setConversationId: (id) => set({ currentConversationId: id }),
}))
