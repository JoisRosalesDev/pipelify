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
