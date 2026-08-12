import { Node, Edge } from "@xyflow/react";
import { ExecutionStatus } from "@/components/atoms/StatusBadge";

export type { ExecutionStatus };

export type ETLNodeType = "extractor" | "transformer" | "loader";

export interface NodeMetrics {
  processedRecords?: number;
  recordsProcessed?: number;
  durationMs?: number;
  executionTimeMs?: number;
  memoryUsageMb?: number;
  throughputRps?: number;
  errorRate?: number;
  [key: string]: any;
}

export interface ETLNodeConfig {
  sourceType?: string;
  destinationType?: string;
  tableName?: string;
  query?: string;
  batchSize?: number;
  timeoutSec?: number;
  retryAttempts?: number;
  transformFunction?: string;
  [key: string]: any;
}

export interface ETLNodeData {
  label: string;
  type: ETLNodeType;
  status: ExecutionStatus;
  metrics?: NodeMetrics;
  config?: ETLNodeConfig;
  errorMessage?: string;
  icon?: string;
  description?: string;
  [key: string]: unknown;
}

export type ETLNode = Node<ETLNodeData, "customETLNode" | "etlNode" | string>;
export type ETLEdge = Edge;

export interface PipelineDAGPayload {
  pipeline_id: string;
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      type: string;
      config?: ETLNodeConfig;
      [key: string]: any;
    };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }[];
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: ExecutionStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  nodes?: Record<string, { status: ExecutionStatus; metrics?: NodeMetrics }>;
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  nodeId?: string;
  executionId?: string;
}

export interface WSEventPayload {
  event:
    | "EXECUTION_STARTED"
    | "NODE_UPDATED"
    | "EXECUTION_FINISHED"
    | "LOG_EMITTED"
    | "PING"
    | "PONG";
  execution_id: string;
  node_id?: string;
  status?: ExecutionStatus;
  metrics?: NodeMetrics;
  error_message?: string;
  log?: {
    level: LogLevel;
    message: string;
    timestamp?: string;
  };
  timestamp?: string;
}
