/**
 * API client for backend integration
 * Falls back to mock data if backend is unavailable
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface GeneratePromptRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface GeneratePromptResponse {
  id: string
  response: string
  model: string
  timestamp: string
}

export interface HistoryItem {
  id: string
  prompt: string
  response: string
  model: string
  timestamp: string
  temperature?: number
}

export interface HistoryListResponse {
  items: HistoryItem[]
  total?: number
  cursor?: string
}

let useMock = false

async function fetchWithFallback<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    useMock = false
    return await response.json()
  } catch (error) {
    console.warn(`API call failed, using mock: ${error}`)
    useMock = true
    throw error // Let caller handle mock fallback
  }
}

export async function createPrompt(
  request: GeneratePromptRequest
): Promise<GeneratePromptResponse> {
  try {
    const response = await fetchWithFallback<GeneratePromptResponse>(
      '/api/prompts',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
    return response
  } catch {
    // Fallback to mock
    const { mockGenerateResponse } = await import('./mock')
    const response = await mockGenerateResponse(
      request.prompt,
      request.model || 'gpt-4o-mini',
      request.temperature || 0.7
    )
    
    return {
      id: crypto.randomUUID(),
      response,
      model: request.model || 'gpt-4o-mini',
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getHistory(params?: {
  query?: string
  limit?: number
  cursor?: string
}): Promise<HistoryListResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.query) queryParams.append('query', params.query)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.cursor) queryParams.append('cursor', params.cursor)
    
    const response = await fetchWithFallback<HistoryListResponse>(
      `/api/history?${queryParams.toString()}`
    )
    return response
  } catch {
    // Fallback to mock
    const { getMockHistory } = await import('./mock')
    const items = getMockHistory(params?.query)
    return {
      items: items.slice(0, params?.limit || 20),
      total: items.length,
    }
  }
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  try {
    const response = await fetchWithFallback<HistoryItem>(`/api/history/${id}`)
    return response
  } catch {
    // Fallback to mock
    const { getMockHistoryItem } = await import('./mock')
    return getMockHistoryItem(id)
  }
}

export async function updateSettings(settings: {
  model?: string
  temperature?: number
  maxTokens?: number
}): Promise<void> {
  try {
    await fetchWithFallback('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  } catch {
    // Settings are stored locally anyway, so failure is acceptable
    console.warn('Failed to sync settings to backend, using local storage only')
  }
}
