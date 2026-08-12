"use client";

import { useCallback, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  Node,
  Edge,
} from "@xyflow/react";
import { ETLNodeData, ETLNodeType, ExecutionStatus, NodeMetrics } from "@/types/pipeline";

const INITIAL_NODES: Node<ETLNodeData>[] = [
  {
    id: "node-1",
    type: "customETLNode",
    position: { x: 100, y: 150 },
    data: {
      label: "Extractor Postgres",
      type: "extractor",
      status: "PENDING",
      description: "Extracción de ventas desde DB PostgreSQL",
      config: {
        sourceType: "PostgreSQL",
        tableName: "sales_orders",
        batchSize: 5000,
        timeoutSec: 30,
      },
      metrics: {
        processedRecords: 0,
        durationMs: 0,
      },
    },
  },
  {
    id: "node-2",
    type: "customETLNode",
    position: { x: 450, y: 150 },
    data: {
      label: "Transformador Mapeo",
      type: "transformer",
      status: "PENDING",
      description: "Limpieza y normalización de campos JSON",
      config: {
        transformFunction: "clean_currency_fields",
        retryAttempts: 3,
      },
      metrics: {
        processedRecords: 0,
        durationMs: 0,
      },
    },
  },
  {
    id: "node-3",
    type: "customETLNode",
    position: { x: 800, y: 150 },
    data: {
      label: "Cargador Data Lake",
      type: "loader",
      status: "PENDING",
      description: "Carga final hacia AWS S3 / Parquet",
      config: {
        destinationType: "AWS S3",
        tableName: "analytics.fact_sales",
        batchSize: 10000,
      },
      metrics: {
        processedRecords: 0,
        durationMs: 0,
      },
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "edge-1-2",
    source: "node-1",
    target: "node-2",
    animated: false,
    style: { stroke: "hsl(var(--border))", strokeWidth: 2 },
  },
  {
    id: "edge-2-3",
    source: "node-2",
    target: "node-3",
    animated: false,
    style: { stroke: "hsl(var(--border))", strokeWidth: 2 },
  },
];

export function useDAGState(
  initialNodes: Node<ETLNodeData>[] = INITIAL_NODES,
  initialEdges: Edge[] = INITIAL_EDGES
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ETLNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: false,
            style: { stroke: "hsl(var(--border))", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const addNode = useCallback(
    (type: ETLNodeType, position: { x: number; y: number }, label?: string) => {
      const newNodeId = `node-${Date.now()}`;
      const defaultLabels: Record<ETLNodeType, string> = {
        extractor: "Extractor DB",
        transformer: "Transformador ETL",
        loader: "Cargador Target",
      };

      const newNode: Node<ETLNodeData> = {
        id: newNodeId,
        type: "customETLNode",
        position,
        data: {
          label: label || defaultLabels[type] || "Nuevo Nodo",
          type,
          status: "PENDING",
          description: `Nodo de tipo ${type}`,
          config: {
            batchSize: 1000,
            retryAttempts: 3,
          },
          metrics: {
            processedRecords: 0,
            durationMs: 0,
          },
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
    },
    [setNodes]
  );

  const updateNodeStatus = useCallback(
    (nodeId: string, status: ExecutionStatus, metrics?: NodeMetrics, errorMessage?: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              status,
              ...(metrics ? { metrics: { ...node.data.metrics, ...metrics } } : {}),
              ...(errorMessage !== undefined ? { errorMessage } : {}),
            },
          };
        })
      );

      // Animate edges connecting to or from running nodes
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === nodeId || edge.target === nodeId) {
            return {
              ...edge,
              animated: status === "RUNNING",
              style: {
                ...edge.style,
                stroke:
                  status === "RUNNING"
                    ? "#3b82f6"
                    : status === "COMPLETED"
                    ? "#10b981"
                    : status === "FAILED"
                    ? "#ef4444"
                    : "hsl(var(--border))",
              },
            };
          }
          return edge;
        })
      );
    },
    [setNodes, setEdges]
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, any>, label?: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              ...(label ? { label } : {}),
              config: {
                ...node.data.config,
                ...config,
              },
            },
          };
        })
      );
    },
    [setNodes]
  );

  const resetNodeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "PENDING",
          errorMessage: undefined,
          metrics: {
            processedRecords: 0,
            durationMs: 0,
          },
        },
      }))
    );
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: { stroke: "hsl(var(--border))", strokeWidth: 2 },
      }))
    );
  }, [setNodes, setEdges]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return {
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectNode,
    addNode,
    updateNodeStatus,
    updateNodeConfig,
    resetNodeStatuses,
    clearCanvas,
  };
}
