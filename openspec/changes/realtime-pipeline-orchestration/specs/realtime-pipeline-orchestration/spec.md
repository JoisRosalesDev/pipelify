# Especificación Técnica: Orquestación y Monitoreo de Pipelines ETL en Tiempo Real

**Cambio:** `realtime-pipeline-orchestration`  
**Plataforma:** Pipelify (SaaS DevTool)  
**Estado:** Especificación Técnica Completa  

---

## 1. Contratos de Dependencias

### 1.1. Dependencias Frontend (`package.json`)
Versiones exactas fijas sin prefijos `^` ni `~` para garantizar la reproducibilidad determinista en CI/CD y despliegues en Vercel.

```json
{
  "name": "pipelify-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@xyflow/react": "12.0.4",
    "tailwindcss": "3.4.7",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.40",
    "@prisma/client": "5.17.0",
    "lucide-react": "0.417.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/node": "20.14.12",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "prisma": "5.17.0",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

### 1.2. Dependencias Backend (`requirements.txt`)
Versiones exactas fijas fijadas con operador `==` sin rangos ni comodines para Python 3.11+.

```text
fastapi==0.111.1
uvicorn==0.30.3
pydantic==2.8.2
pydantic-settings==2.3.4
sqlalchemy==2.0.31
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.13.2
redis==5.0.7
celery==5.4.0
pyjwt==2.8.0
passlib==1.7.4
python-dotenv==1.0.1
httpx==0.27.0
```

---

## 2. Modelos de Datos

### 2.1. Esquema Prisma (`prisma/schema.prisma`)
Optimizado para migraciones en PostgreSQL 15+.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model PipelineExecution {
  id           String                  @id @default(uuid()) @db.Uuid
  pipelineId   String                  @map("pipeline_id") @db.VarChar(64)
  status       ExecutionStatus         @default(PENDING)
  dagSnapshot  Json                    @map("dag_snapshot")
  errorSummary String?                 @map("error_summary") @db.Text
  startedAt    DateTime?               @map("started_at") @db.Timestamptz
  finishedAt   DateTime?               @map("finished_at") @db.Timestamptz
  createdAt    DateTime                @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime                @updatedAt @map("updated_at") @db.Timestamptz
  nodeResults  PipelineNodeExecution[]

  @@index([status])
  @@map("pipeline_executions")
}

model PipelineNodeExecution {
  id           String            @id @default(uuid()) @db.Uuid
  executionId  String            @map("execution_id") @db.Uuid
  nodeId       String            @map("node_id") @db.VarChar(64)
  nodeType     String            @map("node_type") @db.VarChar(32)
  status       ExecutionStatus   @default(PENDING)
  attemptCount Int               @default(0) @map("attempt_count")
  errorMessage String?           @map("error_message") @db.Text
  inputData    Json?             @map("input_data")
  outputData   Json?             @map("output_data")
  startedAt    DateTime?         @map("started_at") @db.Timestamptz
  finishedAt   DateTime?         @map("finished_at") @db.Timestamptz
  createdAt    DateTime          @default(now()) @map("created_at") @db.Timestamptz
  execution    PipelineExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId, nodeId])
  @@map("pipeline_node_executions")
}
```

### 2.2. Modelos SQLAlchemy Async (`app/models/execution.py`)
Mapeo asíncrono SQLAlchemy 2.0 compatible con la base de datos migrada por Prisma.

```python
import enum
from datetime import datetime
from typing import Optional, Any, List
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Enum as SQLEnum, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class ExecutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PipelineExecutionModel(Base):
    __tablename__ = "pipeline_executions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    pipeline_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        SQLEnum(ExecutionStatus, name="execution_status_enum", create_type=False),
        default=ExecutionStatus.PENDING,
        nullable=False
    )
    dag_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    node_executions: Mapped[List["PipelineNodeExecutionModel"]] = relationship(
        back_populates="execution", cascade="all, delete-orphan"
    )

class PipelineNodeExecutionModel(Base):
    __tablename__ = "pipeline_node_executions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    execution_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("pipeline_executions.id", ondelete="CASCADE"), nullable=False)
    node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    node_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        SQLEnum(ExecutionStatus, name="execution_status_enum", create_type=False),
        default=ExecutionStatus.PENDING,
        nullable=False
    )
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    input_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    execution: Mapped["PipelineExecutionModel"] = relationship(back_populates="node_executions")
```

### 2.3. Esquemas Pydantic v2 (`app/schemas/pipeline.py`)

```python
from enum import Enum
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class ExecutionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ReactFlowNodeData(BaseModel):
    label: str = Field(..., description="Nombre descriptivo del nodo visual")
    type: str = Field(..., description="Tipo de operación ETL: extractor, transformer, loader")
    config: Dict[str, Any] = Field(default_factory=dict, description="Parámetros específicos del nodo ETL")
    
    model_config = ConfigDict(extra="ignore")

class ReactFlowNode(BaseModel):
    id: str = Field(..., description="Identificador único del nodo en el grafo")
    type: str = Field(..., description="Tipo de nodo React Flow")
    position: Dict[str, float] = Field(..., description="Coordenadas visuales {x, y}")
    data: ReactFlowNodeData

class ReactFlowEdge(BaseModel):
    id: str = Field(..., description="Identificador de la conexión")
    source: str = Field(..., description="ID del nodo origen")
    target: str = Field(..., description="ID del nodo destino")
    sourceHandle: Optional[str] = Field(None, description="Puerto de salida opcional")
    targetHandle: Optional[str] = Field(None, description="Puerto de entrada opcional")

class PipelineDAGPayload(BaseModel):
    pipeline_id: str = Field(..., max_length=64, description="Identificador único del pipeline ETL")
    nodes: List[ReactFlowNode] = Field(..., min_items=1, description="Lista de nodos del DAG")
    edges: List[ReactFlowEdge] = Field(..., description="Conexiones entre nodos del DAG")

class ExecutionResponse(BaseModel):
    execution_id: UUID = Field(..., description="UUID único de la ejecución creada")
    pipeline_id: str = Field(..., description="Identificador del pipeline")
    status: ExecutionStatus = Field(..., description="Estado inicial de la ejecución (PENDING)")
    created_at: str = Field(..., description="Marca de tiempo ISO-8601 de creación")

class PipelineNodeExecutionDetail(BaseModel):
    id: UUID
    execution_id: UUID
    node_id: str
    node_type: str
    status: ExecutionStatus
    attempt_count: int
    error_message: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    created_at: str

class ExecutionDetailResponse(BaseModel):
    execution_id: UUID
    pipeline_id: str
    status: ExecutionStatus
    dag_snapshot: Dict[str, Any]
    error_summary: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    created_at: str
    updated_at: str
    node_executions: List[PipelineNodeExecutionDetail] = Field(default_factory=list)

class WSEventPayload(BaseModel):
    event: str = Field(..., description="Tipo de evento: EXECUTION_STARTED, NODE_UPDATED, EXECUTION_FINISHED, PING, PONG")
    execution_id: UUID = Field(..., description="UUID de la ejecución")
    node_id: Optional[str] = Field(None, description="ID del nodo actualizado (si aplica)")
    status: ExecutionStatus = Field(..., description="Estado actual alcanzado")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Métricas de ejecución (registros procesados, tiempo ms)")
    error_message: Optional[str] = Field(None, description="Mensaje de error detallado")
    timestamp: str = Field(..., description="Marca de tiempo UTC en formato ISO-8601")
```

---

## 3. Contratos de API y WebSockets

### 3.1. API REST Endpoints

#### Endpoint 1: Ingesta de Ejecución (`POST /api/v1/executions`)
- **Descripción:** Ingesta asíncrona del DAG para encolado inmediato. Devuelve respuesta rápida `202 Accepted`.
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <JWT_TOKEN>`
- **Body Request:** Payload JSON `PipelineDAGPayload`.
- **Response 202 Accepted:**
  ```json
  {
    "execution_id": "3a7b9c20-8d5f-4a1e-b2c3-d4e5f6a7b8c9",
    "pipeline_id": "pipe_etl_sales_v1",
    "status": "PENDING",
    "created_at": "2026-08-12T15:10:00Z"
  }
  ```
- **Errores:** `400 Bad Request` (payload no válido / DAG cíclico), `401 Unauthorized`.

#### Endpoint 2: Detalle de Ejecución (`GET /api/v1/executions/{execution_id}`)
- **Descripción:** Consulta el estado consolidado de la ejecución y el desglose de nodos.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response 200 OK:** Payload JSON `ExecutionDetailResponse`.
- **Errores:** `404 Not Found`, `401 Unauthorized`.

#### Endpoint 3: Desglose de Nodos (`GET /api/v1/executions/{execution_id}/nodes`)
- **Descripción:** Obtiene los registros individuales de ejecución de cada nodo del pipeline.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response 200 OK:** `List[PipelineNodeExecutionDetail]`.

#### Endpoint 4: Cancelación de Ejecución (`POST /api/v1/executions/{execution_id}/cancel`)
- **Descripción:** Aborta la ejecución de un pipeline en progreso en los Celery workers.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response 200 OK:** `{"execution_id": "...", "status": "FAILED", "error_summary": "Cancelado manualmente por el usuario"}`

---

### 3.2. Contrato WebSocket y Protocolo en Tiempo Real

- **URI de Conexión:** `wss://api.pipelify.com/ws/executions/{execution_id}?token={JWT_TOKEN}`
- **Handshake y Autenticación:**
  - El parámetro de consulta `token` es validado obligatoriamente antes de aceptar la conexión (`websocket.accept()`).
  - Si el token expira o carece de permisos sobre el pipeline, se rechaza la conexión inmediatamente con código de cierre WS `1008 Policy Violation`.
- **Protocolo Heartbeat Ping-Pong:**
  - Frecuencia del servidor: Cada **20 segundos**, FastAPI transmite `{"event": "PING"}`.
  - Respuesta del cliente: El cliente frontend responde con `{"event": "PONG"}`.
  - Cierre por inactividad: Si no hay tramas de retorno en un lapso de 60 segundos, el socket se cancela y se liberan las suscripciones Redis Pub/Sub en el bloque `finally`.
- **Protocolo de Reconexión en el Frontend:**
  - En caso de cierre no limpio (código distinto de `1000 Normal Closure`), el hook de React Flow reconecta aplicando **Backoff Exponencial con Jitter**:
    $$t_{\text{espera}} = \min(1000 \cdot 2^{\text{intento}} + \text{jitter\_ms}, 30000)$$
  - El límite máximo de reintento es de 30 segundos.
- **Formato de Mensajes WebSocket:**

**1. Evento `EXECUTION_STARTED` (Inicio de Ejecución):**
```json
{
  "event": "EXECUTION_STARTED",
  "execution_id": "3a7b9c20-8d5f-4a1e-b2c3-d4e5f6a7b8c9",
  "node_id": null,
  "status": "RUNNING",
  "metrics": null,
  "error_message": null,
  "timestamp": "2026-08-12T15:10:02Z"
}
```

**2. Evento `NODE_UPDATED` (Progreso de Nodo ETL):**
```json
{
  "event": "NODE_UPDATED",
  "execution_id": "3a7b9c20-8d5f-4a1e-b2c3-d4e5f6a7b8c9",
  "node_id": "node_extractor_01",
  "status": "RUNNING",
  "metrics": {
    "records_processed": 5000,
    "execution_time_ms": 320.4
  },
  "error_message": null,
  "timestamp": "2026-08-12T15:10:05Z"
}
```

**3. Evento `EXECUTION_FINISHED` (Finalización Exitosa o Fallida):**
```json
{
  "event": "EXECUTION_FINISHED",
  "execution_id": "3a7b9c20-8d5f-4a1e-b2c3-d4e5f6a7b8c9",
  "node_id": null,
  "status": "COMPLETED",
  "metrics": {
    "total_records": 5000,
    "total_duration_ms": 1420.0
  },
  "error_message": null,
  "timestamp": "2026-08-12T15:10:15Z"
}
```

---

## 4. Topología de Directorios (Atomic Design Layout)

El Frontend utiliza **Next.js 14 App Router** siguiendo rigurosamente la metodología de **Atomic Design** en `src/components/`, separando componentes de UI reactiva y vistas de páginas.

```
pipelify/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── pipelines/
│   │   │   │   ├── page.tsx                       # Lista de pipelines creados
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx                   # Editor de DAG y orquestador
│   │   │   └── executions/
│   │   │       └── [executionId]/
│   │   │           └── page.tsx                   # Monitoreo en tiempo real de ejecución
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.ts                       # Healthcheck endpoint de Next.js
│   │   ├── layout.tsx                             # Root layout con providers
│   │   ├── page.tsx                               # Landing o redirección inicial
│   │   └── globals.css                            # Estilos globales y utilidades Tailwind
│   ├── components/
│   │   ├── atoms/                                 # Elementos básicos indivisibles de UI
│   │   │   ├── StatusBadge.tsx                    # Insignia de estado (PENDING, RUNNING, COMPLETED, FAILED)
│   │   │   ├── ExecutionSpinner.tsx               # Indicador animado de ejecución activa
│   │   │   ├── ConnectionIndicator.tsx            # Indicador de estado WebSocket (Conectado/Desconectado)
│   │   │   ├── ActionButton.tsx                   # Botón con estados de carga y deshabilitado
│   │   │   ├── IconWrapper.tsx                    # Contenedor estandarizado para iconos de Lucide
│   │   │   └── MetricLabel.tsx                    # Etiqueta de métrica individual
│   │   ├── molecules/                             # Combinaciones simples de 2+ átomos
│   │   │   ├── NodeHeader.tsx                     # Cabecera de nodo React Flow con título e icono de estado
│   │   │   ├── ExecutionControls.tsx              # Barra de control (Ejecutar, Pausar, Cancelar)
│   │   │   ├── LogViewerRow.tsx                   # Fila individual de log con timestamp y nivel
│   │   │   ├── MetricCard.tsx                     # Tarjeta contenedora de métricas ETL
│   │   │   └── PipelineInfoBanner.tsx             # Banner de información básica del pipeline
│   │   ├── organisms/                             # Componentes complejos interactivos
│   │   │   ├── PipelineCanvas.tsx                 # Lienzo interactivo React Flow con soporte de DAG
│   │   │   ├── CustomETLNode.tsx                  # Nodo personalizado de React Flow con indicadores en tiempo real
│   │   │   ├── NodeConfigPanel.tsx                # Panel lateral de configuración de parámetros del nodo
│   │   │   ├── ExecutionLogsTable.tsx             # Tabla de logs y eventos de ejecución
│   │   │   └── SidebarPalette.tsx                 # Paleta arrastrable de tipos de nodos ETL
│   │   ├── templates/                             # Disposiciones estructurales y layouts de página
│   │   │   ├── PipelineOrchestratorTemplate.tsx   # Layout del lienzo + paleta + panel de configuración
│   │   │   └── ExecutionDetailTemplate.tsx        # Layout de monitoreo con canvas + logs + métricas
│   │   └── providers/
│   │       ├── ReactFlowProvider.tsx              # Provider de React Flow
│   │       └── WebSocketProvider.tsx              # Contexto global para la conexión WebSocket
│   ├── hooks/
│   │   ├── usePipelineWebSocket.ts                # Hook para ciclo de vida y reconexión de WebSocket
│   │   ├── usePipelineExecution.ts                # Hook para consumo de API REST de ejecuciones
│   │   └── useDAGState.ts                         # Hook para manejo de nodos y bordes de React Flow
│   ├── lib/
│   │   ├── api-client.ts                          # Cliente HTTP encapsulado para FastAPI
│   │   └── utils.ts                               # Funciones auxiliares de formateo y clases Tailwind
│   └── types/
│       ├── pipeline.ts                            # Interfaces TypeScript de DAG, nodos y ejecuciones
│       └── websocket.ts                           # Tipos de eventos WebSocket y cargas útiles
├── prisma/
│   └── schema.prisma                              # Esquema Prisma único fijado
├── package.json                                   # Dependencias exactas fijadas
├── tsconfig.json                                  # Configuración de TypeScript
└── tailwind.config.js                             # Configuración de Tailwind CSS
```

Backend Topología (FastAPI en Python):

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── executions.py                  # Endpoints REST POST/GET/CANCEL executions
│   │       │   └── websockets.py                  # Endpoint WSS de streaming en tiempo real
│   │       └── router.py                          # Enrutador principal de API v1
│   ├── core/
│   │   ├── config.py                              # Ajustes Pydantic Settings (.env)
│   │   ├── security.py                            # Verificación JWT y hashing
│   │   └── redis.py                               # Cliente asíncrono aioredis y PubSub
│   ├── db/
│   │   └── session.py                             # Async Engine SQLAlchemy & async_sessionmaker
│   ├── models/
│   │   └── execution.py                           # Modelos SQLAlchemy 2.0 (PipelineExecutionModel)
│   ├── schemas/
│   │   └── pipeline.py                            # Esquemas Pydantic v2 de DAG y eventos WS
│   ├── services/
│   │   ├── execution_service.py                   # Lógica de negocio de ejecuciones
│   │   └── orchestrator.py                        # Despachador de tareas ETL hacia Redis/Celery
│   ├── workers/
│   │   ├── celery_app.py                          # Configuración e inicialización de Celery
│   │   └── tasks.py                               # Tareas asíncronas ETL y republicación PubSub
│   └── main.py                                    # Aplicación FastAPI, CORS y middleware
├── alembic/                                       # Migraciones DB alternativas/respaldo
├── requirements.txt                               # Dependencias backend fijas exactas
└── Dockerfile                                     # Dockerfile de producción para Render
```

---

## 5. Variables de Entorno (`.env.example`)

La siguiente tabla especifica el contrato estricto de variables de entorno requeridas tanto para el entorno de desarrollo como para los entornos de producción en Vercel (Frontend) y Render/Supabase (Backend).

| Nombre de Variable | Destino | Descripción / Uso | Valor de Ejemplo | Requerido |
| :--- | :--- | :--- | :--- | :---: |
| `NEXT_PUBLIC_API_URL` | Frontend | URL base para peticiones REST HTTP a FastAPI backend | `https://api.pipelify.com` | Sí |
| `NEXT_PUBLIC_WS_URL` | Frontend | URL base para la conexión de streaming por WebSocket | `wss://api.pipelify.com` | Sí |
| `DATABASE_URL` | Both | URI de conexión PostgreSQL (Pooling con PgBouncer/Supabase) | `postgresql://user:pass@db.supabase.co:5432/pipelify` | Sí |
| `DIRECT_URL` | Backend | Conexión directa a PostgreSQL para migraciones de esquema | `postgresql://user:pass@db.supabase.co:5432/pipelify?direct=true` | Sí |
| `UPSTASH_REDIS_URL` | Backend | URI de conexión Redis para Broker Celery y Pub/Sub | `redis://default:abc123token@upstash.io:6379` | Sí |
| `JWT_SECRET_KEY` | Backend | Clave secreta para la firma y verificación de tokens JWT | `super_secret_jwt_key_32_bytes_len!!` | Sí |
| `JWT_ALGORITHM` | Backend | Algoritmo de encriptación utilizado en tokens de sesión | `HS256` | Sí |
| `CORS_ORIGINS` | Backend | Lista de orígenes permitidos separados por comas para CORS | `https://pipelify.vercel.app,http://localhost:3000` | Sí |
| `CELERY_CONCURRENCY` | Backend | Número de procesos worker concurrentes de Celery | `4` | Sí |
| `LOG_LEVEL` | Both | Nivel de verbosidad de logs (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` | Sí |
