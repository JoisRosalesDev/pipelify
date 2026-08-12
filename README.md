# Pipelify — Plataforma SaaS DevTool para Orquestación y Monitoreo de Pipelines ETL en Tiempo Real

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.1-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.0.4-FF007A?style=flat-square&logo=react)](https://reactflow.dev/)
[![Celery](https://img.shields.io/badge/Celery-5.4.0-3776AB?style=flat-square&logo=celery)](https://docs.celeryq.dev/)
[![Redis](https://img.shields.io/badge/Upstash_Redis-5.0.7-DC382D?style=flat-square&logo=redis)](https://upstash.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.7-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue.svg?style=flat-square)](LICENSE)

**Pipelify** es una plataforma SaaS distribuida de alto rendimiento diseñada para la ingeniería de datos moderna. Permite el diseño visual e interactivo de Grafo Acíclico Dirigido (DAG), la ingesta asíncrona de alta velocidad (< 100ms), la ejecución tolerante a fallos mediante workers Celery y el monitoreo de telemetría reactiva en vivo vía WebSockets y Redis Pub/Sub.

---

## 🏛️ Topología de Arquitectura Híbrida Distribuida

La infraestructura de Pipelify está estructurada para garantizar un desacoplamiento absoluto entre la interfaz visual de monitoreo (desplegada en **Vercel**) y el motor de orquestación asíncrono (desplegado en **Render**), interconectados mediante un Broker/Caché global (**Upstash Redis**) y una base de datos relacional de alta disponibilidad (**PostgreSQL**).

```mermaid
graph TD
    subgraph Frontend ["Vercel (Next.js 14 App Router)"]
        UI["Lienzo React Flow (Canvas)"]
        WSClient["Cliente WebSocket (WS Provider)"]
        RESTClient["Cliente HTTP (Fetch Service)"]
    end

    subgraph Backend ["Render (FastAPI + Async Python 3.11)"]
        API["Gateway REST API (FastAPI)"]
        WSGateway["Gateway WebSocket (wss://...)"]
        Orchestrator["Orquestador DAG (Algoritmo de Kahn)"]
    end

    subgraph Broker ["Upstash (Redis Serverless)"]
        CeleryQueue["Cola de Tareas Celery"]
        PubSub["Canales Pub/Sub (execution:{id})"]
    end

    subgraph Workers ["Worker Nodes (Render / Celery)"]
        WorkerTask["Workers Celery (Backoff + Jitter)"]
    end

    subgraph Database ["Supabase / Aiven (PostgreSQL 15+)"]
        DB[(PostgreSQL DB)]
    end

    RESTClient -->|POST /api/v1/executions HTTP 202| API
    API -->|Encola Tarea| CeleryQueue
    CeleryQueue -->|Consume Tarea| WorkerTask
    WorkerTask -->|Orquesta Nodos ETL| Orchestrator
    Orchestrator -->|Persiste Estado Atómico| DB
    Orchestrator -->|Publica Eventos Telemetría| PubSub
    PubSub -->|Escucha Eventos| WSGateway
    WSGateway <-->|Conexión Persistente WSS / Heartbeat 20s| WSClient
    WSClient -->|Actualiza Estados y Logs| UI
```

---

## ⚙️ Máquina de Estados y Resiliencia en Workers

El ciclo de vida de cada pipeline está gobernado por una **State Machine** atómica respaldada por PostgreSQL con el enum `ExecutionStatus`: `PENDING`, `RUNNING`, `COMPLETED` y `FAILED`.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Ingesta POST /api/v1/executions (HTTP 202)
    PENDING --> RUNNING: Celery Worker asume ejecución
    RUNNING --> RUNNING: Ejecución secuencial de nodos DAG (Kahn's Sort)
    RUNNING --> COMPLETED: Todos los nodos finalizan con éxito
    RUNNING --> FAILED: Reintentos agotados / Circuit Breaker (>50% fallos)
    RUNNING --> FAILED: Cancelación explícita POST /executions/{id}/cancel
    COMPLETED --> [*]
    FAILED --> [*]
```

### Mecanismos de Tolerancia a Fallos
1. **Algoritmo de Kahn (Topological Sort):** Valida la aciclicidad del DAG antes de la ejecución. Si detecta ciclos, aborta inmediatamente marcando el estado como `FAILED`.
2. **Exponential Backoff + Jitter:** Las re-ejecuciones de nodos fallidos calculan un tiempo de espera de $t_{wait} = 2^{attempt} + \text{uniform}(0.0, 1.0)$ segundos.
3. **Circuit Breaker:** Si la tasa de fallos de nodos supera el 50% (`failed_count / processed_count > 0.5`), el orquestador aborta la ejecución global de forma segura.
4. **Resiliencia de Workers Celery:** Si un worker agota sus reintentos máximos (`max_retries=3`), captura la excepción y ejecuta la corrutina `_mark_execution_failed_async`, garantizando que PostgreSQL y los suscriptores de WebSocket reciban la notificación de falla sin dejar tareas huérfanas.

---

## 📡 Ciclo de Vida de WebSockets & Telemetría en Tiempo Real

La comunicación bidireccional entre Vercel y Render se realiza mediante conexiones WebSocket seguras (`wss://...`).

### Características del Gateway WS
- **Autenticación Pre-Handshake:** Verifica el token JWT enviado en el parámetro query (`?token=JWT`) antes de llamar a `websocket.accept()`. Si el token es inválido o falta, cierra la conexión con el código `WS_1008_POLICY_VIOLATION`.
- **Heartbeat Ping-Pong:** El servidor envía un frame de control `{"event": "PING"}` cada 20 segundos. El cliente responde con `{"event": "PONG"}`. Si pasan 60 segundos sin interacción, la conexión se cierra limpiamente.
- **Prevención de Fugas de Memoria:** El bucle de escucha de Redis Pub/Sub se encuentra protegido dentro de un bloque `try...finally` que garantiza la llamada a `pubsub.unsubscribe("execution:{id}")` y `pubsub.close()` al desconectarse el cliente.

---

## 🎨 Sistema de Diseño (Atomic Design & Mobile First)

El frontend está estructurado siguiendo la metodología **Atomic Design**, con un paradigma de diseño monocromático de alta legibilidad (`bg-zinc-50` / `bg-zinc-950`, `text-zinc-900` / `text-zinc-100`) y acentos semánticos según el estado del proceso.

```
src/
├── app/                        # Next.js 14 App Router
│   ├── (dashboard)/
│   │   ├── executions/[executionId]/page.tsx   # Canvas interactivo y consola en vivo
│   │   └── pipelines/page.tsx                  # Dashboard principal de pipelines
│   ├── globals.css             # Variables HSL y custom scrollbars
│   ├── layout.tsx              # Metadatos SEO, OpenGraph y Providers
│   ├── robots.ts               # Configuración para buscadores
│   └── sitemap.ts              # Mapa del sitio dinámico
├── components/
│   ├── atoms/                  # Átomos (StatusBadge, ConnectionIndicator, ActionButton)
│   ├── molecules/              # Moléculas (LogViewerRow, ExecutionControls, MobileBottomSheet, MetricCard)
│   ├── organisms/              # Organismos (CustomETLNode, PipelineCanvas, SidebarPalette, NodeConfigPanel, ExecutionLogsTable)
│   └── providers/              # Proveedores de Contexto (ReactFlowProvider, WebSocketProvider)
├── hooks/                      # Custom Hooks (useDAGState, usePipelineTelemetry)
├── services/                   # Cliente API REST (api.ts)
└── types/                      # Definiciones de tipos TypeScript (pipeline.ts)
```

---

## 📋 Requisitos Previos e Instalación

### Requisitos del Sistema
- **Node.js:** v18.17+ o v20+
- **Python:** v3.11+
- **PostgreSQL:** v15+ (Local, Supabase o Aiven)
- **Redis:** Serverless (Upstash Redis)

### Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/pipelify_db"
ASYNC_DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/pipelify_db"

# Redis & Celery Configuration (Upstash Redis)
UPSTASH_REDIS_URL="rediss://default:token@upstash.io:6379"

# Security & CORS Configuration
JWT_SECRET_KEY="tu_clave_secreta_jwt_para_produccion"
JWT_ALGORITHM="HS256"
CORS_ORIGINS="http://localhost:3000,https://pipelify.vercel.app"

# Application Endpoints
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 Guía de Ejecución Local

### 1. Instalación de Dependencias

#### Frontend (Next.js 14)
```bash
npm install
```

#### Backend (FastAPI + Celery)
```bash
python -m venv venv
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Inicialización de la Base de Datos
```bash
# Generar cliente de Prisma para migraciones de esquema
npx prisma db push
```

### 3. Ejecución de Servicios

#### Servidor FastAPI (Backend)
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Worker de Celery (Procesamiento Asíncrono)
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info -P solo
```

#### Servidor Next.js (Frontend)
```bash
npm run dev
```

Navega a `http://localhost:3000` en tu navegador.

---

## 📡 Contratos de API y WebSockets

### 1. Ingesta de Pipeline (Asíncrono)
- **Endpoint:** `POST /api/v1/executions`
- **Código de Respuesta:** `HTTP 202 Accepted` (< 100ms)
- **Payload:**
```json
{
  "pipeline_id": "etl-sales-sync",
  "nodes": [
    { "id": "node-1", "type": "extractor", "label": "Postgres Sales", "config": { "tableName": "orders" } },
    { "id": "node-2", "type": "transformer", "label": "Limpieza JSON", "config": { "transformFunction": "clean_fields" } },
    { "id": "node-3", "type": "loader", "label": "S3 Data Lake", "config": { "destinationType": "AWS S3" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2" },
    { "id": "e2-3", "source": "node-2", "target": "node-3" }
  ]
}
```

### 2. Telemetría WebSocket en Vivo
- **URI:** `wss://api.pipelify.com/ws/executions/{execution_id}?token=JWT`
- **Evento Transmitido (Ejemplo `NODE_UPDATED`):**
```json
{
  "event": "NODE_UPDATED",
  "execution_id": "d9b2e3f4-1234-5678-9abc-def012345678",
  "node_id": "node-1",
  "status": "RUNNING",
  "metrics": {
    "processedRecords": 5000,
    "durationMs": 450
  },
  "timestamp": "2026-08-12T15:45:00.000Z"
}
```

---

## 🌐 Despliegue ONE SHOT

### Despliegue del Frontend en Vercel
1. Conecta el repositorio de GitHub a Vercel.
2. Configura las Variables de Entorno:
   - `NEXT_PUBLIC_API_URL`: `https://tu-api-render.onrender.com`
   - `NEXT_PUBLIC_WS_URL`: `wss://tu-api-render.onrender.com`
   - `NEXT_PUBLIC_APP_URL`: `https://pipelify.vercel.app`
3. Haz clic en **Deploy**.

### Despliegue del Backend en Render
1. Crea un **Web Service** en Render conectando la carpeta `backend/`.
2. Comando de inicio: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Crea un **Background Worker** en Render para Celery:
   - Comando de inicio: `celery -A app.workers.celery_app worker --loglevel=info`
4. Configura las variables de entorno (`UPSTASH_REDIS_URL`, `DATABASE_URL`, `CORS_ORIGINS`).

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---
*Desarrollado con estándares de ingeniería de software distribuidos, resiliencia y Clean Architecture.*
