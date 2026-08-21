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
import { AppNavbar } from "@/components/organisms/AppNavbar";
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
    deleteNode,
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

  // Breadcrumbs dinámicos
  const breadcrumbItems = [
    { label: "Pipelines", href: "/pipelines" },
    { label: rawId, href: `/executions/${rawId}` },
    ...(executionId && executionId !== rawId
      ? [{ label: `Ejecución (${executionId.slice(0, 8)}...)`, current: true }]
      : [{ label: "Lienzo Canvas", current: true }]),
  ];

  // Estado para minimizar/expandir consola
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);

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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Barra de Navegación limpia: Logo y enlaces */}
      <AppNavbar />

      {/* Barra Superior Compacta de Controles y Resumen */}
      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PipelineInfoBanner
            pipelineId={`Pipeline: ${rawId}`}
            executionId={executionId || "Pendiente de despacho"}
            status={status}
            wsStatus={wsStatus}
            totalNodes={metrics.totalNodes}
            duration={formatDuration(durationSec)}
          />

          {/* Métricas Compactas e Inline */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>Nodos: {metrics.completedNodes}/{metrics.totalNodes}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>{metrics.totalRecordsProcessed.toLocaleString()} filas</span>
            </div>

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
            onDeleteNode={deleteNode}
            onClose={() => onSelectNode(null)}
            className="hidden md:flex"
          />
        )}
      </div>

      {/* Consola de Logs en Tiempo Real (Minimizada o Expandida) */}
      <div
        className={`${
          isConsoleMinimized ? "h-10" : "h-44 sm:h-52"
        } shrink-0 border-t border-zinc-200 dark:border-zinc-800 transition-all duration-200`}
      >
        <ExecutionLogsTable
          logs={logs}
          onClearLogs={clearLogs}
          isMinimized={isConsoleMinimized}
          onToggleMinimize={() => setIsConsoleMinimized((prev) => !prev)}
          className="h-full rounded-none border-none"
        />
      </div>

      {/* Sheet Inferior para Dispositivos Móviles */}
      {selectedNode && (
        <MobileBottomSheet
          node={selectedNode}
          onDeleteNode={deleteNode}
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
