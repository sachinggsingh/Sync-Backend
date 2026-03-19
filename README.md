# 🚀 SyncEditor Server

<p align="center">
  <img src="https://img.shields.io/badge/node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node Version" />
  <img src="https://img.shields.io/badge/express-v4.18-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Version" />
  <img src="https://img.shields.io/badge/socket.io-v4.7-black?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io Version" />
  <img src="https://img.shields.io/badge/opentelemetry-observability-blueviolet?style=for-the-badge&logo=opentelemetry&logoColor=white" alt="OTel" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
</p>

Backend server for the **SyncEditor** collaborative code editor platform. Built for performance, security, and real-time synchronization.

---

## 📖 Overview

SyncEditor Server is a high-performance Node.js service providing the backbone for real-time collaboration. It leverages Socket.IO for low-latency communication and integrated OpenTelemetry for production-grade observability.

**Authentication model:** the current implementation is intentionally simple – clients supply a plain username when emitting the `join` event; the server does not perform any credentials check.  This keeps the focus on the collaboration features and makes the service easier to run locally.

## ✨ Features

- ⚡ **Real-Time Sync**: Low-latency code and chat synchronization.
- 🏢 **Room Management**: Secure, isolated collaborative environments.
- 🛡️ **Production Security**: Rate limiting, XSS protection, and CSP headers.
- 🔍 **First-Class Observability**: Distributed tracing with Jaeger v2 and log aggregation with Grafana/Loki.
- 🧪 **Simple auth**: clients provide a username when joining; no backend login required.

---

## Flow of the things how it's going on

<div align="center">
<img src="./assets/Screenshot 2026-03-14 at 3.06.44 PM.png" alt="System representation" width="900"/>

</div>

## 📊 Monitoring & Observability

Standardized observability using **OpenTelemetry** and **Jaeger v2**.

### 🔍 Distributed Tracing
Visualize the entire lifecycle of collaborative events.

<div align="center">
  <img src="./assets/Screenshot 2026-03-07 at 4.35.44 PM.png" alt="Trace 1" width="900" />
  <br><i>System interaction visualization and latency analysis.</i>
  <br><br>
  <img src="./assets/Screenshot 2026-03-07 at 4.36.42 PM.png" alt="Trace 2" width="900" />
  <br><i>Deep dive into span processing and event execution.</i>
  <br><br>
  <img src="./assets/Screenshot 2026-03-07 at 4.37.29 PM.png" alt="Trace 3" width="900" />
  <br><i>Real-time collaboration concurrency tracking.</i>
</div>

### 📝 Structured Logs & Aggregation
Powered by `winston`, enriched with OpenTelemetry context, and aggregated via **Loki**.

1.  **Enrichment**: Logs are automatically injected with `trace_id` and `span_id`.
2.  **Scraping**: **Promtail** tails the JSON log files.
3.  **Aggregation**: Logs are pushed to **Loki** for indexing.
4.  **Visualization**: View and query logs in **Grafana**, with direct links to distributed traces.
5.  **Insights**: Real-time log monitoring for rapid debugging.

<div align="center">
  <img src="./assets/Screenshot 2026-03-19 at 4.32.48 PM.png" alt="Loki Logs" width="900" />
  <br><i>Centralized log aggregation in Grafana Loki.</i>
</div>

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-time**: [Socket.IO](https://socket.io/)
- **Auth**: none (naive username-based)
- **Tracing**: [Jaeger](https://www.jaegertracing.io/)
- **Log Aggregation**: [Loki](https://grafana.com/oss/loki/) & [Promtail](https://grafana.com/docs/loki/latest/clients/promtail/)
- **Visualization**: [Grafana](https://grafana.com/)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/) 
- **Logging**: [Winston](https://github.com/winstonjs/winston)

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file:
```env
PORT=5555
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
SOCKET_PING_TIMEOUT=120000
SOCKET_PING_INTERVAL=30000
```

### 3. Execution
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with Nodemon |
| `npm start` | Run production-ready server |

---

## 🔌 Socket.IO API

### 📤 Outgoing (Client → Server)
- `join`: `{ roomId, username }`
- `leave`: `{ roomId, username }`
- `code-change`: `{ roomId, code, sender }`
- `send-message`: `{ roomId, message, sender, time }`

### 📥 Incoming (Server → Client)
- `user-joined`: `{ clients, username, socketId }`
- `user-left`: `{ socketId, username }`
- `code-change`: `{ code, sender }`
- `receive-message`: `{ message, sender, time }`
- `error`: `{ message }`

---

## 🏗️ Project Structure

```text
Server/
├── src/
│   ├── index.js             # Entry point: Starts server & initializes OTel
│   ├── app.js               # Application setup: Middleware, routes, & error handling
│   ├── config/              # Configuration files
│   │   ├── otel.js          # OpenTelemetry SDK configuration
│   │   └── clerk.js         # Authentication configuration (Clerk)
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication & user identification
│   │   ├── rateLimiter.js   # Resource usage control
│   │   └── validator.js     # Input schema validation
│   ├── sockets/             # Socket.IO implementation
│   │   ├── index.js         # Socket server initialization
│   │   └── handlers.js      # Core logic for code sync, chat, & room management
│   └── utils/               # Helper functions
│       └── logger.js        # Winston structured logging setup
├── otel-config/             # Observability infrastructure config
│   ├── logging/             # Loki, Promtail, & Grafana setup
│   └── otel/                # OTel Collector configurations
├── k8s/                     # Kubernetes manifests
│   ├── deployment.yaml      # App deployment & container spec
│   ├── service.yaml         # LoadBalancer & port config
│   └── hpa.yaml             # Horizontal Pod Autoscaler
├── assets/                  # Documentation images & screenshots
├── tests/                   # Integration & Unit test suites
├── Dockerfile               # Production container definition
└── package.json             # Dependencies & scripts
```

---

## 🛠️ Detailed Component Roles

- **Socket Handlers**: The brain of the real-time engine, handling complex concurrency for code edits and ensuring all room participants stay in sync.
- **OTel Infrastructure**: Provides the full observability pipeline, mapping application events to distributed traces for debugging production issues.
- **K8s Manifests**: Production-ready configurations for deploying the server in a scalable Kubernetes environment with automated scaling.
- **Security Middleware**: Multi-layered protection including rate limiting to prevent abuse and schema validation for all incoming socket/HTTP payloads.

---

## 🛡️ Security
- **Rate Limiting**: 100 req/15min per IP.
- **Validation**: Strict schema validation for all inputs.
- **Headers**: Helmet-secured headers (XSS, HSTS, CSP).

## 🗺️ Roadmap
- [x] Tracing (Jaeger)  
- [x] Centralized Log Aggregation (Loki/Grafana)
- [ ] Distributed Metrics (Prometheus)
- [ ] Health Dashboard UI
- [ ] Custom Performance Spans

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
