# AI Meeting Intelligence Assistant 🧠🎙️

An end-to-end **AI-powered Meeting Intelligence platform** that transforms raw meeting recordings into **actionable insights** — including transcripts, summaries, tasks, sentiment analysis, and intelligent Q&A.

Built with a **production mindset**, clean architecture, asynchronous processing, and a modern developer-first UI.

---

## 🚀 What This Project Does

This application allows users to:

1. Upload meeting recordings (audio/video)
2. Process them asynchronously using AI pipelines
3. Extract:
   - Timestamped transcripts
   - Structured summaries
   - Action items & decisions
   - Sentiment analysis
4. Ask intelligent questions about meetings (RAG-based Q&A)

The system is inspired by tools like **Fireflies.ai**, **Otter.ai**, and **Fathom**, but built from scratch with full backend + frontend ownership.

---

## 🧩 Key Features

### 🎧 Meeting Upload & Processing
- Upload audio/video files (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`)
- Backend processes meetings asynchronously
- Real-time status tracking with progress stages

### 📊 Processing Pipeline (Step-by-Step)
- Uploaded
- Processing
- Transcribed
- Summarized
- Tasks Extracted
- Sentiment Analyzed
- Ready

### 📝 Transcript
- Timestamped segments
- Searchable and scrollable
- Clean editor-style UI

### 🧠 AI Summary
- Bullet-point highlights
- Detailed contextual summary
- Topic extraction
- Decision tracking

### ✅ Tasks & Action Items
- Extracted automatically from conversation
- Structured and readable
- Ready for export or follow-up

### 📈 Sentiment Analysis
- Overall meeting sentiment
- Confidence scores
- Speaker-wise analysis

### 💬 AI Q&A (RAG)
- Ask natural language questions about the meeting
- Answers grounded in transcript context
- Source-backed responses

---

## 🏗️ Architecture Overview

### Frontend
- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **TanStack Query** for server state
- **Zustand** for client state
- Dark-mode, responsive, production-ready UI

### Backend
- **FastAPI**
- Asynchronous background processing
- RESTful API design
- Status polling architecture
- Modular AI pipeline (transcription → NLP → sentiment → vector indexing)

### Storage & Indexing
- File storage for uploads
- Vector database for semantic search (RAG)
- Structured meeting metadata

---

## 🔁 System Workflow

```text
Upload Meeting
      ↓
POST /meetings/upload
      ↓
POST /meetings/{id}/process
      ↓
GET  /meetings/{id}/status  (polling)
      ↓
GET  /meetings/{id}
      ↓
Meeting Insights + Q&A
