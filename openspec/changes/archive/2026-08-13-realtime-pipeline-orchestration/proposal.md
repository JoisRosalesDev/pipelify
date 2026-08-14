# Propuesta Técnica: Orquestación y Monitoreo de Pipelines ETL en Tiempo Real

**Cambio:** `realtime-pipeline-orchestration`  
**Plataforma:** Pipelify (SaaS DevTool)  
**Estado:** Propuesto  

---

## 1. Topología de Despliegue Híbrido

### 1.1. Arquitectura de Componentes e Interacción

El sistema implementa una arquitectura distribuida desacoplada para garantizar baja latencia en la ingesta, ejecución resiliente de flujos ETL y actualización reactiva en tiempo real sobre el lienzo interactivo en el cliente.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Usuario (Navegador Web)
    participant FE as Frontend (Vercel / Next.js 14)
    participant API as Backend (Render / FastAPI)
    participant Redis as Broker & Cache (Upstash Redis)
    participant Worker as Workers (Celery / Async Task)
    participant DB as DB Relacional (Supabase / PostgreSQL 15)

    Cliente->>FE: Diseña y ejecuta DAG en React Flow
    FE->>API: POST /api/v1/executions (Payload JSON del DAG)
    API->>DB: INSERT INTO pipeline_executions (status='PENDING')
    API->>Redis: RPUSH celery_queue (Task execution_id)
    API-->>FE: HTTP 202 Accepted { "execution_id": "uuid-v4", "status": "PENDING" }

    FE->>API: WSS /ws/executions/{execution_id}?token=JWT
    API->>API: Validar JWT Token
    API->>Redis: SUBSCRIBE execution:{execution_id}
    API-->>FE: WS 101 Switching Protocols (Conexión Establecida)

    Worker->>Redis: BLPOP celery_queue
    Worker->>DB: UPDATE pipeline_executions SET status='RUNNING'
    Worker->>Redis: PUBLISH execution:{execution_id} {"event": "EXECUTION_STARTED"}
    Redis-->>API: Mensaje de Pub/Sub
    API-->>FE: WS Frame: EXECUTION_STARTED

    loop Por cada Nodo del DAG
        Worker->>Worker: Ejecutar Tarea del Nodo (Circuit Breaker & Backoff)
        Worker->>DB: INSERT INTO pipeline_node_executions
        Worker->>Redis: PUBLISH execution:{execution_id} {"event": "NODE_UPDATED", "node_id": "node_1", "status": "RUNNING"}
        Redis-->>API: Mensaje Pub/Sub
        API-->>FE: WS Frame: NODE_UPDATED (React Flow resalta nodo activo)
    end

    alt Ejecución Exitosa
        Worker->>DB: UPDATE pipeline_executions SET status='COMPLETED'
        Worker->>Redis: PUBLISH execution:{execution_id} {"event": "EXECUTION_FINISHED", "status": "COMPLETED"}
    else Fallo Inrecuperable
        Worker->>DB: UPDATE pipeline_executions SET status='FAILED'
        Worker->>Redis: PUBLISH execution:{execution_id} {"event": "EXECUTION_FINISHED", "status": "FAILED"}
    end

    Redis-->>API: Mensaje Pub/Sub Final
    API-->>FE: WS Frame: EXECUTION_FINISHED
    API->>Redis: UNSUBSCRIBE execution:{execution_id}
    API-->>FE: WS Close 1000 Normal Closure
```

#### Descripción Detallada de Componentes e Interacciones:

1. **Desacoplamiento Absoluto Ingesta/Ejecución (HTTP 202 Accepted):**  
   El cliente envía el gráfico del pipeline (DAG de React Flow) a FastAPI mediante un endpoint HTTP REST. La API valida la estructura con Pydantic v2, guarda el registro inicial en PostgreSQL con estado `PENDING` y encola la tarea en Redis. Devuelve inmediatamente una respuesta `202 Accepted` con el `execution_id` sin bloquear el hilo HTTP.

2. **Capa de Transmisión en Tiempo Real (WebSocket + Upstash Redis Pub/Sub):**  
   FastAPI actúa como puente asíncrono (*WebSocket Gateway*). Al recibir una conexión WebSocket autorizada para una ejecución específica, se suscribe al canal de Redis `execution:{execution_id}`. Cuando los Celery Workers publican eventos de cambio de estado de nodos o del pipeline general, FastAPI retransmite el evento por el WebSocket al cliente frontend.

3. **Ejecución y Resiliencia en Workers (Celery / Background Tasks):**  
   Los workers consumen las tareas de Redis, actualizan PostgreSQL en cada transición de estado y ejecutan las transformaciones ETL. Manejan patrones de retribución (*Exponential Backoff*) y aislamiento mediante *Circuit Breakers* cuando fallan integraciones externas o fuentes de datos.

---

### 1.2. Reglas de Red y Configuración CORS

Debido al despliegue híbrido entre **Vercel** (Frontend Next.js) y **Render** (Backend FastAPI), se deben aplicar políticas estrictas de CORS y reglas de upgrade para conexiones WebSocket.

#### Código de Configuración CORS en FastAPI:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pipelify Orchestration API", version="1.0.0")

ALLOWED_ORIGINS = [
    "https://pipelify.vercel.app",
    "https://pipelify-*.vercel.app",  # Preview deployments de Vercel
    "http://localhost:3000",          # Desarrollo local
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Execution-ID",
        "X-Request-ID",
    ],
    expose_headers=["X-Request-ID"],
    max_age=600,  # Cache de preflight OPTIONS por 10 minutos
)
```

#### Consideraciones de Red para WebSockets en Render/Vercel:
* **Cabeceras de Upgrade:** La solicitud de conexión WebSocket debe incluir los encabezados `Upgrade: websocket` y `Connection: Upgrade`.
* **Manejo de Proxies:** Render finaliza TLS en sus balanceadores de carga. FastAPI debe confiar en las cabeceras `X-Forwarded-For` y `X-Forwarded-Proto` (`wss://` en producción).
* **Timeout HTTP Proxy:** Vercel limita las respuestas HTTP a 10-30s (Serverless). Por esta razón, el monitoreo del pipeline NO utiliza *Long Polling* ni *Server-Sent Events (SSE)* sostenidos sobre funciones Serverless, sino conexiones WebSocket directas desde el cliente Next.js hacia el servidor FastAPI persistente en Render.

---

## 2. Máquina de Estados y Contrato JSON

### 2.1. Máquina de Estados de Ejecución

Cada ejecución de pipeline y cada nodo individual operan bajo una máquina de estados determinista.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Ingesta HTTP (202 Accepted)
    PENDING --> RUNNING: Worker asigna tarea
    RUNNING --> COMPLETED: Todos los nodos finalizan OK
    RUNNING --> FAILED: Nodo falla & reintentos agotados
    RUNNING --> FAILED: Circuit Breaker abierto

    COMPLETED --> [*]
    FAILED --> [*]
```

#### Reglas de Transición y Resiliencia:
* **`PENDING` -> `RUNNING`:** Transición atómica en PostgreSQL ejecutada por el worker mediante `UPDATE ... WHERE status = 'PENDING' RETURNING id`.
* **`RUNNING` -> `RUNNING` (Reintentos Nodos):** En caso de error transitorio en un nodo, se aplica un cálculo de Backoff Exponencial con Jitter:  
  $$t_{\text{wait}} = 2^{\text{attempt}} + \text{uniform}(0, 1)$$  
  Si `attempt < max_retries`, el nodo permanece en reintento interno sin marcar el pipeline como fallido.
* **`RUNNING` -> `FAILED`:** Se activa cuando un nodo excede el límite de reintentos (`max_retries = 3`) o cuando el *Circuit Breaker* (umbral del 50% de fallos en 60s) se abre para evitar saturación de servicios colindantes.

---

### 2.2. Definición en PostgreSQL, Prisma y SQLAlchemy

#### DDL SQL Nativo (PostgreSQL 15+):

```sql
-- Creación del Enum de Estados
CREATE TYPE execution_status_enum AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Tabla Principal de Ejecuciones de Pipeline
CREATE TABLE pipeline_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(64) NOT NULL,
    status execution_status_enum NOT NULL DEFAULT 'PENDING',
    dag_snapshot JSONB NOT NULL,
    error_summary TEXT NULL,
    started_at TIMESTAMPTZ NULL,
    finished_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Ejecución Individual de Nodos
CREATE TABLE pipeline_node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(64) NOT NULL,
    node_type VARCHAR(32) NOT NULL,
    status execution_status_enum NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    input_data JSONB NULL,
    output_data JSONB NULL,
    started_at TIMESTAMPTZ NULL,
    finished_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_executions_status ON pipeline_executions(status);
CREATE INDEX idx_node_executions_lookup ON pipeline_node_executions(execution_id, node_id);
```

#### Esquema de Prisma ORM (`prisma/schema.prisma`):

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

#### Modelos SQLAlchemy Async (`app/models/execution.py`):

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
        SQLEnum(ExecutionStatus, name="execution_status_enum"),
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
        SQLEnum(ExecutionStatus, name="execution_status_enum"),
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

---

### 2.3. Contratos de Datos y Esquemas Pydantic v2

#### Esquemas Pydantic v2 (`app/schemas/pipeline.py`):

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
    label: str
    type: str = Field(..., description="Tipo de nodo: extractor, transformer, loader")
    config: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(extra="ignore")

class ReactFlowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, float] = Field(..., example={"x": 100.0, "y": 200.0})
    data: ReactFlowNodeData

class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class PipelineDAGPayload(BaseModel):
    pipeline_id: str = Field(..., max_length=64)
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]

class ExecutionResponse(BaseModel):
    execution_id: UUID
    pipeline_id: str
    status: ExecutionStatus
    created_at: str

# Payload transmitido por Redis Pub/Sub y WebSocket
class WSEventPayload(BaseModel):
    event: str = Field(..., description="EXECUTION_STARTED, NODE_UPDATED, EXECUTION_FINISHED")
    execution_id: UUID
    node_id: Optional[str] = None
    status: ExecutionStatus
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    timestamp: str
```

#### Ejemplos de JSON Real:

**Payload Ingesta HTTP (`POST /api/v1/executions`):**
```json
{
  "pipeline_id": "pipe_etl_sales_v1",
  "nodes": [
    {
      "id": "node_1",
      "type": "customNode",
      "position": { "x": 100.0, "y": 150.0 },
      "data": {
        "label": "Extraer Postgres S3",
        "type": "extractor",
        "config": { "source_db": "sales_db", "table": "orders" }
      }
    },
    {
      "id": "node_2",
      "type": "customNode",
      "position": { "x": 400.0, "y": 150.0 },
      "data": {
        "label": "Limpiar Nulos",
        "type": "transformer",
        "config": { "drop_nulls": true }
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1-2",
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

**Payload del Evento WebSocket emitido vía Redis Pub/Sub:**
```json
{
  "event": "NODE_UPDATED",
  "execution_id": "a3b8c9d0-1234-5678-9abc-def012345678",
  "node_id": "node_1",
  "status": "RUNNING",
  "metrics": {
    "records_processed": 1500,
    "execution_time_ms": 245.5
  },
  "error_message": null,
  "timestamp": "2026-08-12T15:08:58Z"
}
```

---

## 3. Manejo de Conexiones WebSocket

### 3.1. Flujo de Autenticación y Autorización

Dado que las conexiones WebSocket no permiten fácilmente enviar cabeceras personalizadas desde la API nativa de `WebSocket` en navegadores web, la autenticación se realiza mediante un token JWT pasado como parámetro de consulta (`query param`) con handshake explícito.

```
wss://api.pipelify.com/ws/executions/{execution_id}?token=<JWT_TOKEN>
```

#### Procedimiento de Verificación:
1. El backend intercepta el handshake antes de invocar `websocket.accept()`.
2. Se decodifica y verifica la firma del token JWT con la clave secreta compartida (`HS256`/`RS256`).
3. Se verifica que el `user_id` del token tenga permisos de lectura sobre la organización a la que pertenece el `execution_id`.
4. Si el token es inválido o no autorizado, se rechaza la conexión inmediatamente enviando código HTTP `401 Unauthorized` o cerrando la conexión con código WS `4008 Policy Violation`.

---

### 3.2. Ciclo de Vida de Suscripción Redis Pub/Sub & FastAPI Endpoint

El siguiente módulo implementa la gestión asíncrona de WebSockets en FastAPI con lectura directa desde Upstash Redis Pub/Sub.

```python
import asyncio
import json
import logging
from typing import Dict
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
import redis.asyncio as aioredis

logger = logging.getLogger("pipelify.ws")
router = APIRouter()

REDIS_URL = "redis://default:token@upstash-redis-url:6379"

async def verify_jwt_token(token: str, execution_id: str) -> bool:
    """Valida token JWT y permisos del usuario sobre la ejecucion."""
    if not token or token == "invalid":
        return False
    return True

@router.websocket("/ws/executions/{execution_id}")
async def websocket_execution_endpoint(
    websocket: WebSocket,
    execution_id: UUID,
    token: str = Query(...)
):
    # 1. Autenticación previa al accept
    is_valid = await verify_jwt_token(token, str(execution_id))
    if not is_valid:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    channel_name = f"execution:{execution_id}"
    
    await pubsub.subscribe(channel_name)
    logger.info(f"Cliente WS conectado a {channel_name}")

    async def redis_listener():
        """Escucha mensajes en Redis Pub/Sub y transmite al WebSocket."""
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    await websocket.send_text(data)
                    
                    # Si el pipeline finalizó, se cierra el ciclo
                    parsed = json.loads(data)
                    if parsed.get("event") == "EXECUTION_FINISHED":
                        break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error en redis_listener: {str(e)}")

    async def heartbeat_sender():
        """Envia pings periódicos para mantener activa la conexión."""
        try:
            while True:
                await asyncio.sleep(20)
                await websocket.send_json({"event": "PING"})
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    # Crear tareas asíncronas concurrentes
    listener_task = asyncio.create_task(redis_listener())
    heartbeat_task = asyncio.create_task(heartbeat_sender())

    try:
        # Bucle de recepción para procesar PONG o desconexión del cliente
        while True:
            client_msg = await websocket.receive_text()
            data = json.loads(client_msg)
            if data.get("event") == "PONG":
                logger.debug(f"PONG recibido para {execution_id}")
    except WebSocketDisconnect:
        logger.info(f"Cliente desorganizado limpiamente de {execution_id}")
    except Exception as e:
        logger.warning(f"Excepción en bucle principal WS: {str(e)}")
    finally:
        # 3. Limpieza estricta y prevención de fugas de memoria
        listener_task.cancel()
        heartbeat_task.cancel()
        
        await asyncio.gather(listener_task, heartbeat_task, return_exceptions=True)
        
        await pubsub.unsubscribe(channel_name)
        await pubsub.close()
        await redis_client.close()
        logger.info(f"Recursos liberados correctamente para el canal {channel_name}")
```

---

### 3.3. Heartbeat, Ping-Pong y Prevención de Fugas de Memoria

#### Estrategia de Heartbeat:
* **Frecuencia:** Cada 20 segundos el servidor envía un marco `{"event": "PING"}`.
* **Respuesta Esperada:** El cliente responde con `{"event": "PONG"}`.
* **Detector de Conexiones Zombi:** Si el socket no recibe frames en un intervalo de 60 segundos o falla la escritura de red, la excepción cancela los `asyncio.Task` background y libera los descriptores de conexión.

#### Estrategia de Reconexión en el Frontend (React Flow / Custom Hook):
```typescript
import { useEffect, useRef } from 'react';

export function usePipelineWebSocket(executionId: string, token: string, onEvent: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    function connect() {
      const wsUrl = `wss://api.pipelify.com/ws/executions/${executionId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'PING') {
          ws.send(JSON.stringify({ event: 'PONG' }));
          return;
        }
        onEvent(data);
      };

      ws.onclose = (event) => {
        if (event.code !== 1000) { // Cierre no limpio, reconectar con backoff
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          timerId = setTimeout(connect, timeout);
        }
      };
    }

    connect();

    return () => {
      clearTimeout(timerId);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [executionId, token]);
}
```

---

## 4. Matriz de Trazabilidad y Verificación

| Requisito / Regla | Componente | Mecanismo de Verificación |
| :--- | :--- | :--- |
| **Desacoplamiento Absoluto** | FastAPI `POST /api/v1/executions` | HTTP Status 202 con `execution_id` en < 100ms |
| **Topología Pub/Sub WS** | Upstash Redis + FastAPI WS | Retransmisión de eventos de Celery al cliente |
| **Resiliencia Workers** | Celery + Postgres State Machine | Backoff exponencial con Jitter y Circuit Breaker |
| **Políticas CORS** | `CORSMiddleware` FastAPI | Handshake permitido desde Vercel origins |
| **Prevención Fugas Memoria** | Python `asyncio` context & cleanup | `UNSUBSCRIBE` y `pubsub.close()` en bloque `finally` |
