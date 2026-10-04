"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PipelineInfoBanner } from "@/components/molecules/PipelineInfoBanner";
import { ExecutionControls } from "@/components/molecules/ExecutionControls";
import { PipelineCanvas } from "@/components/organisms/PipelineCanvas";
import { SidebarPalette } from "@/components/organisms/SidebarPalette";
import { NodeConfigPanel } from "@/components/organisms/NodeConfigPanel";
import { ExecutionLogsTable } from "@/components/organisms/ExecutionLogsTable";
import { MobileBottomSheet } from "@/components/molecules/MobileBottomSheet";
import { usePipelineTelemetry } from "@/hooks/usePipelineTelemetry";
import { AppNavbar } from "@/components/organisms/AppNavbar";
import { Cpu, Database, Plus, X } from "lucide-react";
import { ETLNodeType } from "@/types/pipeline";

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

  // Estado para paleta de nodos en mobile
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

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

  // Listener para cerrar paleta móvil con Escape
  useEffect(() => {
    if (!isMobilePaletteOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobilePaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobilePaletteOpen]);

  // Agregar nodo calculando coordenadas escalonadas a partir del último nodo existente
  const handleAddNodeTap = useCallback(
    (type: ETLNodeType) => {
      let position = { x: 250, y: 150 };
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const staggerX = 260;
        const staggerY = nodes.length % 2 === 1 ? 60 : -40;
        position = {
          x: Math.max(50, lastNode.position.x + staggerX),
          y: Math.max(50, lastNode.position.y + staggerY),
        };
      }
      addNode(type, position);
      setIsMobilePaletteOpen(false);
    },
    [nodes, addNode]
  );

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.0`;
  };

  const breadcrumbItems = [
    { label: "Pipelines", href: "/pipelines" },
    { label: rawId, current: true },
  ];

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Barra de Navegación con Wayfinding */}
      <AppNavbar breadcrumbs={breadcrumbItems} />

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
            {/* Botón Móvil para Abrir Paleta de Nodos (< md) */}
            <button
              type="button"
              onClick={() => setIsMobilePaletteOpen(true)}
              aria-label="Abrir paleta para agregar nodo"
              className="md:hidden flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold shadow-xs transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nodo</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Nodos: {metrics.completedNodes}/{metrics.totalNodes}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>{metrics.totalRecordsProcessed.toLocaleString()} filas</span>
            </div>

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
      <main id="main-content" className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Paleta Lateral Izquierda (Desktop) */}
        <SidebarPalette
          onAddNode={handleAddNodeTap}
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
      </main>

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

      {/* Sheet Inferior de Edición de Nodo para Dispositivos Móviles */}
      {selectedNode && (
        <MobileBottomSheet
          node={selectedNode}
          onUpdateConfig={updateNodeConfig}
          onDeleteNode={deleteNode}
          onClose={() => onSelectNode(null)}
        />
      )}

      {/* Sheet / Drawer Móvil para Paleta de Nodos (< md) */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsMobilePaletteOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-palette-title"
            className="relative z-10 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto flex flex-col"
          >
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0 cursor-grab" />
            <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 shrink-0">
              <h2
                id="mobile-palette-title"
                className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
              >
                Agregar Nodo al Pipeline
              </h2>
              <button
                type="button"
                onClick={() => setIsMobilePaletteOpen(false)}
                aria-label="Cerrar paleta de nodos"
                className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <SidebarPalette
                onAddNode={handleAddNodeTap}
                className="w-full border-r-0 p-0 bg-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutionDetailPage() {
  return <ExecutionDetailPageContent />;
}
