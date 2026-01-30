# AI Meeting Intelligence Assistant - Backend

FastAPI backend for the AI Meeting Intelligence Assistant with MongoDB and file upload support.

## Prerequisites

- Python 3.10 or higher
- MongoDB (running locally or via Docker)

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

Default values:
- `MONGODB_URL=mongodb://localhost:27017`
- `MONGODB_DB_NAME=meeting_intelligence`
- `MAX_FILE_SIZE_MB=25`
- `STORAGE_BASE_PATH=storage/uploads`

### 4. Run MongoDB

#### Option A: Using Docker (Recommended)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option B: Local MongoDB Service

Make sure MongoDB is installed and running on your system.

### 5. Run the Application

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /health` - Returns `{"status": "ok"}`

### Meetings

- `POST /meetings/upload` - Upload a meeting file (multipart/form-data)
  - Accepts: mp3, wav, m4a, mp4, webm
  - Max size: 25MB
  - Returns: `{meeting_id, status, progress}`

- `GET /meetings/{meeting_id}/status` - Get meeting status
  - Returns: `{meeting_id, status, progress, updated_at, error}`

- `GET /meetings/{meeting_id}` - Get full meeting document

- `GET /meetings` - List latest 20 meetings
  - Returns: Array of `{meeting_id, title, created_at, status, progress}`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   └── logging.py       # Logging setup
│   ├── db/
│   │   └── mongo.py         # MongoDB connection
│   ├── models/
│   │   └── meeting.py       # Pydantic models
│   ├── routes/
│   │   └── meetings.py      # Meeting endpoints
│   └── utils/
│       └── files.py         # File handling utilities
├── storage/
│   └── uploads/             # Uploaded files storage
├── requirements.txt
├── .env.example
└── README.md
```

## Development

The application uses:
- **FastAPI** for the web framework
- **Motor** for async MongoDB operations
- **Pydantic** for data validation and settings
- **Uvicorn** as the ASGI server

## Notes

- Uploaded files are stored in `storage/uploads/{meeting_id}/original.{ext}`
- Meeting records are stored in MongoDB collection `meetings`
- CORS is enabled for `http://localhost:3000` and `http://localhost:5173`
