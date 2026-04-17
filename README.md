# Task Tracker: Cloud Native Architecture

A robust, full-stack 3-tier task management application built with a modern Kanban style UI. Engineered for production environments, containerized using Docker, orchestrated locally with Compose, and dynamically deployed to Kubernetes via a comprehensive CI/CD pipeline.

---

## 🏗 Architecture & Communication Flow

```mermaid
graph TD
    %% External System Entities
    Browser("Client Browser")
    GH("GitHub Actions CI/CD")

    %% Cluster boundaries
    subgraph cluster_k8s ["Kubernetes Cluster (Minikube)"]
        Ingress("Nginx Ingress Controller")
        
        subgraph cluster_frontend ["Frontend Components"]
            FrontSvc("Frontend Service :80")
            FrontPod1("Frontend Pod 1 (Nginx/React)")
            FrontPod2("Frontend Pod 2 (Nginx/React)")
        end
        
        subgraph cluster_backend ["Backend Components"]
            BackSvc("Backend Service :8000")
            BackPod1("Backend Pod 1 (Python FastAPI)")
            BackPod2("Backend Pod 2 (Python FastAPI)")
            Config("App ConfigMap")
            Secret("App Secrets")
        end
        
        subgraph cluster_database ["Database Components"]
            DBSvc("Postgres Service :5432")
            DBPod("Postgres Pod")
            PVC[("Postgres PVC")]
        end
        
        Runner("Self-Hosted Local Runner")
    end

    %% Network Routing Paths
    Browser -->|"http://minikube-ip"| Ingress
    Ingress -->|"/api/*"| BackSvc
    Ingress -->|"/*"| FrontSvc
    
    FrontSvc --> FrontPod1
    FrontSvc --> FrontPod2
    
    BackSvc --> BackPod1
    BackSvc --> BackPod2
    
    BackPod1 -->|"SQL over TCP"| DBSvc
    BackPod2 -->|"SQL over TCP"| DBSvc
    
    DBSvc --> DBPod
    DBPod --> PVC
    
    %% Config Mount Paths
    Config -.->|"Env Vars"| BackPod1
    Config -.->|"Env Vars"| BackPod2
    Secret -.->|"DB Credentials"| BackPod1
    Secret -.->|"DB Credentials"| BackPod2
    Secret -.->|"Init Credentials"| DBPod
    
    %% Automation Paths
    GH -->|"Triggers pipeline push"| Runner
    Runner -.->|"kubectl patching"| BackSvc
    Runner -.->|"kubectl patching"| FrontSvc
```

---

## 💻 Local Setup Instructions

### Prerequisites
- Docker and Docker Compose installed.
- Node.js (v20+) and Python (v3.12+).

### Environment Variables
For local execution, the environment strictly forces decoupled secrets. Do not commit these files:
- **`backend/.env.dev`**: Contains `DATABASE_URL` and `SECRET_KEY`.
- **`frontend/.env.development`**: Contains `VITE_API_URL=http://localhost:8000/`.

### Running with Docker Compose
To test the entire orchestrated 3-tier stack locally without K8s overhead:
```bash
# Spin up the frontend, backend, and Postgres database on a shared internal network
docker-compose up -d --build

# Follow the live logs
docker-compose logs -f
```
The application will be universally bound to port 80. Access it at **http://localhost**.

---

## ☸️ Kubernetes Deployment

The project contains native manifests targeting a Minikube cluster environment.
1. **Start the Cluster**:
   ```bash
   minikube start
   minikube addons enable ingress
   ```
2. **Apply Configurations**:
   Generate your secure credentials using the dry-run CLI to prevent Git exposure.
   ```bash
   kubectl create secret generic backend-secret \
     --from-literal=DATABASE_URL="postgresql://user:password@db-svc:5432/tasktracker" \
     --from-literal=POSTGRES_USER="user" \
     --from-literal=POSTGRES_PASSWORD="password" \
     --from-literal=SECRET_KEY="super-secret-production-key" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
3. **Deploy the Fleet**:
   ```bash
   kubectl apply -f k8s/
   ```
4. **Access the Application**: Find your Minikube IP via `minikube ip` and hit it in the browser!

---

## 🚀 CI/CD Pipeline

We employ a robust GitHub Actions pipeline mapped to `.github/workflows/deploy.yml`. 
To bypass Minikube's hypervisor networking isolations, passing Cloud-to-Laptop restrictions securely, we use a **Self-Hosted Runner Daemon**. 

- **Builds**: Docker images are pushed natively to `avinash3003/task-tracker-cicd` using the following tagging strategy:

| Service | Image Tag |
|---|---|
| Backend | `backend-v${{ github.run_number }}` |
| Frontend | `frontend-v${{ github.run_number }}` |

- **Delivery**: `kubectl set image` applies a Zero-Downtime Rolling Update sequentially to the pods.
- **Verification**: `smoke_test.sh` generates a temporary K8s container to ping the internal `/health` endpoints.

*(View the live pipeline runs directly on the [GitHub Actions UI](https://github.com/Avinash3003/task-tracker-devops/actions))*

---

## 🔌 API Documentation

| Endpoint | Method | Body / Payload | Description |
|---|---|---|---|
| `/register` | POST | `{ username, email, password }` | Creates user, hashes password, returns access token. |
| `/login` | POST | `{ username, password }` | Authenticates against Postgres and responds with JWT token. |
| `/tasks` | GET  | `Authorization: Bearer <token>` | Fetches all active non-deleted tasks matching the user. |
| `/tasks` | POST | `{ title, description, status, deadline }` | Creates a new Kanban task on the Postgres relational table. |

---

## 📋 Logging Guide

Our microservices natively reject local file-logging in favor of native Cloud Native `stdout` structured JSON objects. Every request from the React frontend intrinsically generates a `X-Correlation-ID` header.

**To trace a request live across all pod instances:**
```bash
# Tail logs across ALL backend replicas simultaneously
kubectl logs -f deployment/backend-deployment
```

**What each field means**:
- `timestamp`: UTC execution time.
- `level`: INFO, WARNING, or ERROR thresholds.
- `service_name`: Context identifier.
- `correlation_id`: The unified Frontend UUID. Search this exact UUID to trace a bug traversing throughout the React Router down to the precise PostgreSQL transaction!

---

## ⚖️ Design Decisions & Tradeoffs

1. **Self Hosted Runners vs Cloud Cloud API Exposures**: Instead of exposing the Minikube cluster dynamically through local firewalls to allow GitHub IP ranges in, we deployed a local Github Runner. The tradeoff is local hardware wear, but it strictly guarantees a bulletproof, isolated environment closure.
2. **Postgres PVC Persistence over Managed Databases**: For local Kubernetes development, relying on a PersistentVolumeClaim inside the cluster rather than hooking into an external RDS instance allows full offline testing mobility, at the cost of higher risk upon node failure since database backups must be natively managed.
3. **Nginx Reverse Polling in Frontend Container**: Rather than injecting a separate standalone Nginx pod purely for API Reverse proxying, the Vite Frontend container spins up lightweight Nginx to serve the React assets *and* proxy API routing. This halves the operational cluster resources for routing, while slightly violating the single-concern Docker principle.
