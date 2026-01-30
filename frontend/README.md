# AI Assistant Frontend

Modern, premium dashboard for AI-powered prompt and response management.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animations)
- **TanStack Query** (server state)
- **Zustand** (client state)
- **next-themes** (dark/light mode)

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

### Backend Integration

The frontend includes a robust API client with automatic mock fallback:

- **API Client**: `src/lib/api.ts`
- **Mock Data**: `src/lib/mock.ts`

If backend endpoints are unavailable or return errors, the app automatically falls back to mock data, allowing full UI functionality for demos.

### Expected Backend Endpoints

The frontend expects these endpoints (but works with mocks if unavailable):

- `POST /api/prompts` - Generate AI response
  ```json
  {
    "prompt": "string",
    "model": "string",
    "temperature": 0.7,
    "maxTokens": 2000
  }
  ```
  Returns: `{ id, response, model, timestamp }`

- `GET /api/history?query=&limit=&cursor=` - List history
  Returns: `{ items: [...], total?, cursor? }`

- `GET /api/history/:id` - Get specific history item
  Returns: `{ id, prompt, response, model, timestamp, temperature? }`

- `PUT /api/settings` - Update settings (optional)
  Body: `{ model?, temperature?, maxTokens? }`

## Features

- ✅ Dark theme by default
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Collapsible sidebar
- ✅ Right panel with prompt settings
- ✅ Real-time prompt/response interface
- ✅ History search and filtering
- ✅ Settings persistence (localStorage)
- ✅ Smooth animations (Framer Motion)
- ✅ Mock data fallback for offline development

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── layout/      # AppShell, Sidebar, Topbar, RightPanel
│   │   ├── prompt/      # PromptInput, ResponsePanel, MessageBubble
│   │   ├── history/     # HistoryList, HistoryItemRow, HistorySearch
│   │   ├── settings/    # SettingsForm
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities, API client, mocks
│   └── store/           # Zustand stores (UI, settings, conversation)
```

## Build

```bash
npm run build
npm start
```
