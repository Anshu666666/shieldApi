# ShieldAPI - Monorepo

ShieldAPI is a microservice security and rate-limiting API Gateway equipped with an automated Anomaly Detection engine and a real-time Admin Command Center Dashboard.

---

## 🏗️ Monorepo Architecture Overview

This project is structured as a **Monorepo** containing all microservices, frontend applications, and shared packages:

```
shieldApi/
├── apps/
│   ├── gateway/           # Core FastAPI HTTP Reverse Proxy & Plugins (Rate Limiter, API Key Check)
│   ├── anomaly-engine/    # Background Python Service (Pipes & Filters log analysis & auto-blocking)
│   ├── dashboard/         # React / Admin Command Center Frontend UI
│   └── backend-service/   # Target Microservice for testing & proxying
├── packages/
│   └── shared/            # Shared types, configurations, and utilities
├── architecture_diagrams.md  # Detailed UML Component & Sequence Diagrams
├── docker-compose.yml     # Multi-container orchestration
└── Project plan.pdf       # Original project specification document
```

---

## 🚀 Services Summary

| Application | Technology | Description |
| :--- | :--- | :--- |
| **`apps/gateway`** | Python / FastAPI / Redis | Micro-Kernel HTTP Reverse Proxy handling request routing, API key validation, and token bucket rate limiting. |
| **`apps/anomaly-engine`** | Python / Pipes & Filters | Background process analyzing traffic logs to detect error bursts (404/500) and auto-blacklist malicious IPs in Redis. |
| **`apps/dashboard`** | React / Tailwind / Vite | Dark-mode, futuristic admin command center displaying live traffic graphs, key management, and anomaly alerts. |
| **`apps/backend-service`** | Python / FastAPI | Protected downstream microservice used as the target proxy destination. |
| **Redis Broker** | Redis | In-memory broker managing token buckets, API key hashes, and blocked IP sets. |

---

## 🛠️ Local Development & Quick Start

To run the entire stack locally using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/Anshu666666/shieldApi.git
cd shieldApi

# Start all services & Redis broker
docker-compose up --build
```

---

## 📐 Architecture & Diagrams

For complete architectural details, including UML Component and Sequence diagrams, see [`architecture_diagrams.md`](./architecture_diagrams.md).
