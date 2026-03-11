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
- 🔍 **First-Class Observability**: Distributed tracing with Jaeger v2.
- 🧪 **Simple auth**: clients provide a username when joining; no backend login required.

---

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

### 📝 Structured Logs
Powered by `winston` and exported via OTLP for centralized log management.

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-time**: [Socket.IO](https://socket.io/)
- **Auth**: none (naive username-based)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/) & [Jaeger](https://www.jaegertracing.io/)
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

## 🏗️ Architecture

```text
Server/
├── src/
│   ├── app.js          # Core Express application
│   ├── index.js        # Entry point & OTel init
│   ├── config/         # OTel & Middleware configs
│   ├── middleware/     # Security & Validation
│   ├── sockets/        # Socket.IO handlers
│   └── utils/          # Logging & Helpers
└── package.json
```

---

## 🛡️ Security
- **Rate Limiting**: 100 req/15min per IP.
- **Validation**: Strict schema validation for all inputs.
- **Headers**: Helmet-secured headers (XSS, HSTS, CSP).

## 🗺️ Roadmap
- [ ] Distributed Metrics (Prometheus/Grafana)
- [ ] Health Dashboard UI
- [ ] Custom Performance Spans

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
