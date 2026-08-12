"use client";

import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import {
  ETLNodeData,
  ExecutionLog,
  ExecutionStatus,
  PipelineDAGPayload,
} from "@/types/pipeline";
import { useDAGState } from "@/hooks/useDAGState";
import { useWebSocketContext } from "@/components/providers/WebSocketProvider";
import { executionApi } from "@/services/api";

interface UsePipelineTelemetryOptions {
  initialExecutionId?: string | null;
  pipelineId?: string;
  initialNodes?: Node<ETLNodeData>[];
  initialEdges?: Edge[];
}

export function usePipelineTelemetry(options: UsePipelineTelemetryOptions = {}) {
  const {
    initialExecutionId = null,
    pipelineId = "pipeline-etl-main",
    initialNodes,
    initialEdges,
  } = options;

  const [executionId, setExecutionId] = useState<string | null>(initialExecutionId);
  const [status, setStatus] = useState<ExecutionStatus>("PENDING");
  const [logs, setLogs] = useState<ExecutionLog[]>([
    {
      id: `log-init-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Sistema de telemetría inicializado. Esperando comandos de ejecución.",
    },
  ]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Integración con el estado del DAG de React Flow
  const dagState = useDAGState(initialNodes, initialEdges);
  const { nodes, edges, updateNodeStatus, resetNodeStatuses } = dagState;

  // Integración con el proveedor WebSocket para Pub/Sub en tiempo real
  const {
    connectionStatus,
    lastEvent,
    connect,
    disconnect,
  } = useWebSocketContext();

  const addLog = useCallback((log: ExecutionLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Reactividad WebSocket: procesar eventos entrantes en tiempo real
  useEffect(() => {
    if (!lastEvent) return;

    const {
      event,
      execution_id,
      node_id,
      status: eventStatus,
      metrics,
      error_message,
      log,
      timestamp,
    } = lastEvent as any;

    // Si el evento no corresponde a la ejecución activa, ignorar
    if (executionId && execution_id && execution_id !== executionId) {
      return;
    }

    const timeStr = timestamp || new Date().toISOString();

    switch (event) {
      case "EXECUTION_STARTED":
        setStatus("RUNNING");
        addLog({
          id: `log-ws-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          level: "INFO",
          message: `[FastAPI WS] Ejecución iniciada en el servidor (ID: ${execution_id})`,
          executionId: execution_id,
        });
        break;

      case "NODE_UPDATED":
        if (node_id && eventStatus) {
          updateNodeStatus(node_id, eventStatus as ExecutionStatus, metrics, error_message);

          const logLevel =
            eventStatus === "FAILED"
              ? "ERROR"
              : eventStatus === "COMPLETED"
              ? "SUCCESS"
              : "INFO";

          addLog({
            id: `log-ws-${Date.now()}-${Math.random()}`,
            timestamp: timeStr,
            level: logLevel,
            message: `[FastAPI WS] Nodo '${node_id}' -> ${eventStatus}${
              error_message ? ` (Error: ${error_message})` : ""
            }`,
            nodeId: node_id,
            executionId: execution_id,
          });
        }
        break;

      case "LOG_EMITTED":
        if (log) {
          addLog({
            id: `log-ws-${Date.now()}-${Math.random()}`,
            timestamp: log.timestamp || timeStr,
            level: log.level || "INFO",
            message: log.message,
            nodeId: node_id,
            executionId: execution_id,
          });
        }
        break;

      case "EXECUTION_FINISHED":
        if (eventStatus) {
          setStatus(eventStatus as ExecutionStatus);
          const logLevel = eventStatus === "COMPLETED" ? "SUCCESS" : "ERROR";
          addLog({
            id: `log-ws-${Date.now()}-${Math.random()}`,
            timestamp: timeStr,
            level: logLevel,
            message: `[FastAPI WS] Ejecución finalizada con estado: ${eventStatus}${
              error_message ? ` - ${error_message}` : ""
            }`,
            executionId: execution_id,
          });
        }
        break;

      default:
        break;
    }
  }, [lastEvent, executionId, updateNodeStatus, addLog]);

  // Conectar automáticamente por WebSocket si existe un executionId inicial
  useEffect(() => {
    if (initialExecutionId && initialExecutionId !== executionId) {
      setExecutionId(initialExecutionId);
      connect(initialExecutionId);
    }
  }, [initialExecutionId, executionId, connect]);

  /**
   * Despacha la ejecución del DAG hacia el servidor mediante REST HTTP 202
   * e inicie la reconexión por WebSocket.
   */
  const dispatchExecution = useCallback(
    async (overridePipelineId?: string): Promise<string | null> => {
      if (nodes.length === 0) {
        const errMessage = "No se puede ejecutar un DAG vacío. Agregue nodos al lienzo.";
        setError(errMessage);
        addLog({
          id: `log-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: errMessage,
        });
        return null;
      }

      setIsDispatching(true);
      setError(null);

      // Resetear nodos locales a estado PENDING
      resetNodeStatuses();
      setStatus("RUNNING");

      const payload: PipelineDAGPayload = {
        pipeline_id: overridePipelineId || pipelineId,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type || "customETLNode",
          position: node.position,
          data: {
            label: node.data.label,
            type: node.data.type,
            config: node.data.config || {},
          },
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
        })),
      };

      addLog({
        id: `log-dispatch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: `Despachando DAG con ${payload.nodes.length} nodos hacia POST /api/v1/executions...`,
      });

      try {
        const response = await executionApi.dispatchExecution(payload);
        const newExecutionId = response.execution_id;

        setExecutionId(newExecutionId);
        addLog({
          id: `log-resp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: "SUCCESS",
          message: `HTTP 202 Accepted. ID de ejecución asignado: ${newExecutionId}`,
          executionId: newExecutionId,
        });

        // Suscribirse inmediatamente a eventos del canal de esta ejecución vía WebSocket
        connect(newExecutionId);
        setIsDispatching(false);
        return newExecutionId;
      } catch (err: any) {
        const errMsg = err.message || "Error al despachar ejecución hacia el backend.";
        setError(errMsg);
        setStatus("FAILED");
        setIsDispatching(false);

        addLog({
          id: `log-err-dispatch-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: `Error en despacho: ${errMsg}`,
        });

        return null;
      }
    },
    [nodes, edges, pipelineId, resetNodeStatuses, addLog, connect]
  );

  /**
   * Solicita la cancelación activa de la ejecución en curso
   */
  const cancelExecution = useCallback(async () => {
    if (!executionId) {
      addLog({
        id: `log-cancel-warn-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "WARN",
        message: "No hay ninguna ejecución activa registrada para cancelar.",
      });
      return;
    }

    addLog({
      id: `log-cancel-req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "WARN",
      message: `Enviando solicitud de cancelación para ejecución: ${executionId}`,
    });

    try {
      await executionApi.cancelExecution(executionId);
      setStatus("FAILED");
      disconnect();

      addLog({
        id: `log-cancel-success-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "SUCCESS",
        message: "Ejecución cancelada con éxito en el servidor.",
        executionId,
      });
    } catch (err: any) {
      addLog({
        id: `log-cancel-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message: `Error al cancelar ejecución: ${err.message}`,
        executionId,
      });
    }
  }, [executionId, addLog, disconnect]);

  /**
   * Reinicia los estados de los nodos en el canvas y desconecta el socket
   */
  const resetExecution = useCallback(() => {
    resetNodeStatuses();
    setStatus("PENDING");
    disconnect();
    setExecutionId(null);
    setError(null);

    addLog({
      id: `log-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Lienzo de pipeline y canal de telemetría reiniciados.",
    });
  }, [resetNodeStatuses, disconnect, addLog]);

  /**
   * Carga los detalles y snapshot de una ejecución previa
   */
  const fetchExecutionDetail = useCallback(
    async (id: string) => {
      try {
        const detail = await executionApi.getExecutionDetail(id);
        setExecutionId(detail.execution_id);
        setStatus(detail.status);

        // Actualizar estado de nodos si vienen en el detalle
        if (detail.node_executions && detail.node_executions.length > 0) {
          detail.node_executions.forEach((nodeExec) => {
            updateNodeStatus(
              nodeExec.node_id,
              nodeExec.status,
              undefined,
              nodeExec.error_message || undefined
            );
          });
        }

        addLog({
          id: `log-fetch-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: "INFO",
          message: `Detalles de la ejecución ${id} cargados exitosamente desde la base de datos.`,
          executionId: id,
        });
      } catch (err: any) {
        addLog({
          id: `log-fetch-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: `Error al recuperar la ejecución ${id}: ${err.message}`,
        });
      }
    },
    [updateNodeStatus, addLog]
  );

  // Cálculo de métricas agregadas del DAG
  const metrics = {
    totalNodes: nodes.length,
    completedNodes: nodes.filter((n) => n.data.status === "COMPLETED").length,
    failedNodes: nodes.filter((n) => n.data.status === "FAILED").length,
    runningNodes: nodes.filter((n) => n.data.status === "RUNNING").length,
    totalRecordsProcessed: nodes.reduce(
      (sum, n) =>
        sum +
        (n.data.metrics?.processedRecords ?? n.data.metrics?.recordsProcessed ?? 0),
      0
    ),
  };

  return {
    ...dagState,
    executionId,
    setExecutionId,
    status,
    wsStatus: connectionStatus,
    logs,
    isDispatching,
    error,
    metrics,
    dispatchExecution,
    cancelExecution,
    resetExecution,
    clearLogs,
    fetchExecutionDetail,
  };
}
