"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@/components/providers/ReactFlowProvider";
import { PipelineInfoBanner } from "@/components/molecules/PipelineInfoBanner";
import { ExecutionControls } from "@/components/molecules/ExecutionControls";
import { ConnectionIndicator } from "@/components/atoms/ConnectionIndicator";
import { PipelineCanvas } from "@/components/organisms/PipelineCanvas";
import { SidebarPalette } from "@/components/organisms/SidebarPalette";
import { NodeConfigPanel } from "@/components/organisms/NodeConfigPanel";
import { ExecutionLogsTable } from "@/components/organisms/ExecutionLogsTable";
import { MobileBottomSheet } from "@/components/molecules/MobileBottomSheet";
import { usePipelineTelemetry } from "@/hooks/usePipelineTelemetry";
import { Cpu, Database, ShieldAlert, Activity } from "lucide-react";
import { MetricCard } from "@/components/molecules/MetricCard";

function ExecutionDetailPageContent() {
  const params = useParams();
  const rawId = (params?.executionId as string) || "pipeline-main";
  const isNew = rawId === "new" || rawId === "demo-execution-id";
  const initialExecId = isNew ? null : rawId;

  const telemetry = usePipelineTelemetry({
    initialExecutionId: initialExecId,
    pipelineId: `pipeline-${rawId}`,
  });

  const {
    nodes,
    edges,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectNode,
    addNode,
    updateNodeConfig,
    executionId,
    status,
    wsStatus,
    logs,
    isDispatching,
    metrics,
    dispatchExecution,
    cancelExecution,
    resetExecution,
    clearLogs,
  } = telemetry;

  // Temporizador de duración de ejecución activa
  const [durationSec, setDurationSec] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (status === "RUNNING") {
      timer = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    } else if (status === "PENDING") {
      setDurationSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.0`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Banner Superior & Controles de Ejecución */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PipelineInfoBanner
            pipelineId={`Pipeline: ${rawId}`}
            executionId={executionId || "Pendiente de despacho"}
            status={status}
            wsStatus={wsStatus}
            totalNodes={metrics.totalNodes}
            duration={formatDuration(durationSec)}
          />

          <div className="flex items-center gap-3">
            <ConnectionIndicator status={wsStatus} />
            <ExecutionControls
              status={status}
              onRun={() => dispatchExecution()}
              onCancel={cancelExecution}
              onReset={resetExecution}
              isDispatching={isDispatching}
            />
          </div>
        </div>

        {/* Tarjetas de Métricas de Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <MetricCard
            title="Progreso Nodos"
            value={`${metrics.completedNodes} / ${metrics.totalNodes}`}
            icon={<Cpu className="w-4 h-4" />}
            variant={metrics.failedNodes > 0 ? "error" : "info"}
          />
          <MetricCard
            title="Registros Procesados"
            value={metrics.totalRecordsProcessed.toLocaleString()}
            unit="filas"
            icon={<Database className="w-4 h-4" />}
            variant="success"
          />
          <MetricCard
            title="Nodos en Ejecución"
            value={metrics.runningNodes}
            icon={<Activity className="w-4 h-4" />}
            variant="warning"
          />
          <MetricCard
            title="Nodos Fallidos"
            value={metrics.failedNodes}
            icon={<ShieldAlert className="w-4 h-4" />}
            variant={metrics.failedNodes > 0 ? "error" : "neutral"}
          />
        </div>
      </div>

      {/* Área Principal: Paleta + Canvas + Panel de Configuración */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Paleta Lateral Izquierda (Desktop) */}
        <SidebarPalette
          onAddNode={(type) => addNode(type, { x: 250, y: 150 })}
          className="hidden md:flex"
        />

        {/* Canvas de React Flow */}
        <div className="flex-1 h-full relative">
          <PipelineCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectNode={onSelectNode}
            onAddNode={addNode}
          />
        </div>

        {/* Panel de Configuración Derecho (Desktop) */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdateConfig={updateNodeConfig}
            onClose={() => onSelectNode(null)}
            className="hidden md:flex"
          />
        )}
      </div>

      {/* Consola de Logs en Tiempo Real */}
      <div className="h-48 sm:h-56 shrink-0 border-t border-zinc-200 dark:border-zinc-800">
        <ExecutionLogsTable
          logs={logs}
          onClearLogs={clearLogs}
          className="h-full rounded-none border-none"
        />
      </div>

      {/* Sheet Inferior para Dispositivos Móviles */}
      {selectedNode && (
        <MobileBottomSheet
          node={selectedNode}
          onClose={() => onSelectNode(null)}
        />
      )}
    </div>
  );
}

export default function ExecutionDetailPage() {
  return (
    <ReactFlowProvider>
      <ExecutionDetailPageContent />
    </ReactFlowProvider>
  );
}
