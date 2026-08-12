import { PipelineDAGPayload, ExecutionStatus } from "@/types/pipeline";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ExecutionResponse {
  execution_id: string;
  pipeline_id: string;
  status: ExecutionStatus;
  created_at: string;
}

export interface PipelineNodeExecutionDetail {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: ExecutionStatus;
  attempt_count: number;
  error_message?: string | null;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
}

export interface ExecutionDetailResponse {
  execution_id: string;
  pipeline_id: string;
  status: ExecutionStatus;
  dag_snapshot: Record<string, unknown>;
  error_summary?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
  node_executions: PipelineNodeExecutionDetail[];
}

/**
 * Función auxiliar para realizar peticiones HTTP de forma segura y tipada.
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        errorMessage = typeof errorBody.detail === "string"
          ? errorBody.detail
          : JSON.stringify(errorBody.detail);
      }
    } catch {
      // Usar mensaje de error predeterminado si el cuerpo no es JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Despacha la ejecución de un DAG de Pipeline ETL hacia el orquestador backend.
 * Endpoint: POST /api/v1/executions
 */
export async function dispatchExecution(
  payload: PipelineDAGPayload
): Promise<ExecutionResponse> {
  return fetchApi<ExecutionResponse>("/api/v1/executions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene el detalle completo de una ejecución y la instantánea de su DAG.
 * Endpoint: GET /api/v1/executions/{execution_id}
 */
export async function getExecutionDetail(
  executionId: string
): Promise<ExecutionDetailResponse> {
  return fetchApi<ExecutionDetailResponse>(`/api/v1/executions/${executionId}`);
}

/**
 * Obtiene el listado de detalles de ejecuciones de todos los nodos de un pipeline.
 * Endpoint: GET /api/v1/executions/{execution_id}/nodes
 */
export async function getExecutionNodes(
  executionId: string
): Promise<PipelineNodeExecutionDetail[]> {
  return fetchApi<PipelineNodeExecutionDetail[]>(`/api/v1/executions/${executionId}/nodes`);
}

/**
 * Solicita la cancelación en curso de una ejecución activa.
 * Endpoint: POST /api/v1/executions/{execution_id}/cancel
 */
export async function cancelExecution(
  executionId: string
): Promise<ExecutionResponse> {
  return fetchApi<ExecutionResponse>(`/api/v1/executions/${executionId}/cancel`, {
    method: "POST",
  });
}

export const executionApi = {
  dispatchExecution,
  getExecutionDetail,
  getExecutionNodes,
  cancelExecution,
};
