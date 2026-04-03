# Task Tracker

A full-stack 3-tier task management application with a modern Kanban-style UI — containerised with Docker and deployed on Kubernetes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Python (FastAPI) |
| Database | PostgreSQL |
| Container Runtime | Docker |
| Local Orchestration | Docker Compose |
| Kubernetes (Local) | Minikube |
| Web Server / Proxy | Nginx |
| Image Registry | Docker Hub |

---

## Features

- JWT authentication (30-min expiry, persists across refresh)
- User registration, login, forgot password
- Task CRUD with soft delete and 5-second undo
- Search by title, filter by date range
- Sort by created date, deadline, or title
- Assign tasks to other users
- Fully responsive Kanban board UI

---

## Local Development (Without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
> Requires a running PostgreSQL instance. Copy `.env.dev` and set your `DATABASE_URL`.

Backend runs at `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## Running with Docker Compose

```bash
# Start all services (frontend, backend, PostgreSQL)
docker-compose up -d --build

# View live logs
docker-compose logs -f
```

Access the app at **`http://localhost`**

---

## Kubernetes Deployment (Minikube)

```bash
# Start Minikube and enable Ingress controller
minikube start
minikube addons enable ingress

# Point Docker CLI to Minikube's internal Docker daemon
eval $(minikube docker-env)

# Build images directly into Minikube (no push needed for local testing)
docker build -t avinash3003/task-tracker-cicd:backend-v2 ./backend
docker build -t avinash3003/task-tracker-cicd:frontend-v2 ./frontend

# Deploy all Kubernetes resources
kubectl apply -f k8s/

# Watch pods come up
kubectl get pods -w
```

Access the app at **`http://$(minikube ip)`**

---

## Repository Structure

```
task-tracker/
├── backend/              # FastAPI application
│   ├── Dockerfile
│   ├── .env.dev          # Local environment config (gitignored)
│   ├── main.py
│   ├── logger.py         # JSON structured logging
│   └── requirements.txt
├── frontend/             # React + Vite application
│   ├── Dockerfile
│   ├── nginx.conf        # Reverse proxy configuration
│   └── src/
│       ├── api.js        # Axios client with correlation ID injection
│       └── logger.js     # Frontend structured logging wrapper
├── k8s/                  # Kubernetes manifests
│   ├── configmap.yaml
│   ├── secret.yaml       # Gitignored — never committed
│   ├── database.yaml
│   ├── backend.yaml
│   ├── frontend.yaml
│   └── ingress.yaml
└── docker-compose.yaml
```

---

## DevOps Summary

### Docker
- Multi-stage `Dockerfile` for both services to keep images lean.
- Nginx inside the frontend container acts as a **reverse proxy**, routing `/api/*` requests to the backend internally — the backend is never directly exposed to the browser.
- `docker-compose.yaml` runs all three services on a shared internal network. Only the frontend is exposed on port `80`.
- Credentials are managed via `.env.dev` locally and environment variables in Docker Compose — never hardcoded.

### Structured Logging
- Backend produces JSON logs using `python-json-logger` with fields: `timestamp`, `level`, `service_name`, `message`, `correlation_id`.
- React frontend generates a unique UUID (`X-Correlation-ID`) for every API call and passes it as a request header, making each action fully traceable across services.

### Kubernetes
- All services run as separate **Deployments with 2 replicas**, communicating via Kubernetes internal DNS only.
- **ConfigMap** holds non-sensitive flags. **Secrets** hold database credentials — both injected via `envFrom`.
- **Liveness and readiness probes** on `GET /health` enable automatic pod restarts on failure.
- **Nginx Ingress** routes `/api/*` to the backend service and `/*` to the frontend through a single cluster entry point.

---

## Docker Hub

Images published at [`avinash3003/task-tracker-cicd`](https://hub.docker.com/r/avinash3003/task-tracker-cicd/tags)

| Service | Tag |
|---|---|
| Backend | `backend-v2` |
| Frontend | `frontend-v2` |
