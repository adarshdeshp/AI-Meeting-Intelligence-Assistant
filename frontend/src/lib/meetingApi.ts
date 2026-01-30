import type {
  Meeting,
  MeetingStatusResponse,
  AskQuestionResponse,
} from '@/types/meeting'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`

  try {
    // Build headers as a plain object for easy manipulation
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    // Merge existing headers if provided (convert HeadersInit to plain object)
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, options.headers)
      }
    }

    // Only set Content-Type if body is not FormData
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,

      // 🔥 CRITICAL: prevent cached responses (especially for /status polling)
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = (errorJson.detail || errorJson.message || errorMessage) as string
      } catch {
        if (errorText) errorMessage = errorText
      }
      throw new Error(errorMessage)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const text = await response.text()
      if (!text.trim()) {
        return {} as T
      }
      return JSON.parse(text) as T
    }

    return {} as T
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Network error or invalid response')
  }
}

export const meetingApi = {
  async uploadMeeting(
    file: File,
    title?: string
  ): Promise<{ meeting_id: string; status: string }> {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)

    const response = await fetchApi<{
      meeting_id: string
      status: string
    }>('/meetings/upload', {
      method: 'POST',
      body: formData,
    })

    return {
      meeting_id: response.meeting_id,
      status: response.status,
    }
  },

  // 🔥 ADD THIS
  async processMeeting(id: string): Promise<void> {
    await fetchApi(`/meetings/${id}/process`, {
      method: 'POST',
    })
  },

  async getMeetingStatus(id: string): Promise<MeetingStatusResponse> {
    return fetchApi<MeetingStatusResponse>(`/meetings/${id}/status`)
  },

  async getMeeting(id: string): Promise<Meeting> {
    const response = await fetchApi<Meeting>(`/meetings/${id}`)
    // Normalize _id/meeting_id to id for consistency
    if (response._id && !response.id) response.id = response._id
    if (response.meeting_id && !response.id) response.id = response.meeting_id
    return response
  },
}
