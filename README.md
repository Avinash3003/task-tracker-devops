# Task Tracker

A full-stack 3-tier task management application with a gaming-inspired UI.

## Architecture

- **Frontend**: React + Vite (Presentation Layer)
- **Backend**: FastAPI + SQLAlchemy (Application Layer)
- **Database**: SQLite (Data Layer)

## Setup & Run

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Features

- JWT authentication (30-min expiry, persists across refresh)
- User registration, login, forgot password
- Task CRUD with soft delete and 5-second undo
- Search by title, filter by date range
- Sort by created date, deadline, or title
- Gaming-style UI with neon accents, glassmorphism, and animations
- Fully responsive design
