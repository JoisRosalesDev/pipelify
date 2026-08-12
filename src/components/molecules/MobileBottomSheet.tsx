"use client";

import React from "react";
import { Node } from "@xyflow/react";
import { X, Activity, Database, Cpu, UploadCloud } from "lucide-react";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ETLNodeData, ETLNodeType } from "@/types/pipeline";

interface MobileBottomSheetProps {
  node: Node<ETLNodeData> | null;
  onClose: () => void;
  className?: string;
}

export function MobileBottomSheet({ node, onClose, className }: MobileBottomSheetProps) {
  if (!node) return null;

  const data = node.data as ETLNodeData;
  const nodeType: ETLNodeType = data.type || "extractor";

  const getIcon = () => {
    switch (nodeType) {
      case "extractor":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "transformer":
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case "loader":
        return <UploadCloud className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-500" />;
    }
  };

  const records = data.metrics?.processedRecords ?? data.metrics?.recordsProcessed ?? 0;
  const duration = data.metrics?.durationMs ?? data.metrics?.executionTimeMs ?? 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 max-h-[80vh] overflow-y-auto md:hidden ${
        className || ""
      }`}
    >
      {/* Touch Drag Handle */}
      <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 cursor-grab" />

      {/* Sheet Header */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">{getIcon()}</div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {data.label || "Nodo Seleccionado"}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">ID: {node.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={data.status || "PENDING"} size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">
            Registros Procesados
          </span>
          <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {records.toLocaleString()}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">
            Tiempo de Ejecución
          </span>
          <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`}
          </span>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="space-y-2 text-xs">
        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">Parámetros</h4>
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 font-mono text-[11px]">
          {data.config?.tableName && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Tabla:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {data.config.tableName}
              </span>
            </div>
          )}
          {data.config?.transformFunction && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Función:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {data.config.transformFunction}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">Tamaño de Lote:</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
              {data.config?.batchSize || 1000}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Reintentos:</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
              {data.config?.retryAttempts || 3}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
