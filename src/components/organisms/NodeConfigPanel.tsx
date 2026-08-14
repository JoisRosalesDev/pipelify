"use client";

import React, { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import { X, Settings, Database, Cpu, UploadCloud, Activity } from "lucide-react";
import { ETLNodeData, ETLNodeType } from "@/types/pipeline";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ActionButton } from "@/components/atoms/ActionButton";

interface NodeConfigPanelProps {
  node: Node<ETLNodeData> | null;
  onUpdateConfig: (nodeId: string, config: Record<string, any>, label?: string) => void;
  onClose: () => void;
  className?: string;
}

export function NodeConfigPanel({
  node,
  onUpdateConfig,
  onClose,
  className,
}: NodeConfigPanelProps) {
  const [label, setLabel] = useState("");
  const [batchSize, setBatchSize] = useState<number>(1000);
  const [retryAttempts, setRetryAttempts] = useState<number>(3);
  const [timeoutSec, setTimeoutSec] = useState<number>(30);
  const [tableName, setTableName] = useState("");
  const [transformFunction, setTransformFunction] = useState("");
  const [forceFail, setForceFail] = useState(false);

  useEffect(() => {
    if (node) {
      const data = node.data as ETLNodeData;
      setLabel(data.label || "");
      setBatchSize(data.config?.batchSize || 1000);
      setRetryAttempts(data.config?.retryAttempts || 3);
      setTimeoutSec(data.config?.timeoutSec || 30);
      setTableName(data.config?.tableName || "");
      setTransformFunction(data.config?.transformFunction || "");
      setForceFail(Boolean(data.config?.force_fail || data.config?.forceFail));
    }
  }, [node]);

  if (!node) return null;

  const data = node.data as ETLNodeData;
  const nodeType: ETLNodeType = data.type || "extractor";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(
      node.id,
      {
        batchSize: Number(batchSize),
        retryAttempts: Number(retryAttempts),
        timeoutSec: Number(timeoutSec),
        force_fail: forceFail,
        ...(tableName ? { tableName } : {}),
        ...(transformFunction ? { transformFunction } : {}),
      },
      label
    );
  };

  const getIcon = () => {
    switch (nodeType) {
      case "extractor":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "transformer":
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case "loader":
        return <UploadCloud className="w-4 h-4 text-emerald-500" />;
      default:
        return <Settings className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <aside
      className={`w-80 xl:w-96 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">{getIcon()}</div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Configuración de Nodo
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">ID: {node.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-300">
            Tipo: {nodeType}
          </span>
        </div>
        <StatusBadge status={data.status || "PENDING"} size="sm" />
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nombre del Nodo
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        {nodeType === "extractor" && (
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tabla / Colección Origen
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. sales_orders"
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        )}

        {nodeType === "transformer" && (
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Función de Transformación
            </label>
            <input
              type="text"
              value={transformFunction}
              onChange={(e) => setTransformFunction(e.target.value)}
              placeholder="e.g. clean_currency_fields"
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        )}

        {nodeType === "loader" && (
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tabla / Destino Target
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. analytics.fact_sales"
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tamaño Lote (Batch)
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Reintentos Máx.
            </label>
            <input
              type="number"
              value={retryAttempts}
              onChange={(e) => setRetryAttempts(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Timeout (Segundos)
          </label>
          <input
            type="number"
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 my-1">
          <input
            type="checkbox"
            id="forceFailCheckbox"
            checked={forceFail}
            onChange={(e) => setForceFail(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
          />
          <label htmlFor="forceFailCheckbox" className="font-medium text-red-700 dark:text-red-300 text-[11px] cursor-pointer">
            Simular Fallo Crítico (Test Circuit Breaker)
          </label>
        </div>

        <ActionButton type="submit" variant="primary" className="mt-2 w-full">
          Guardar Cambios
        </ActionButton>
      </form>

      {/* Telemetry metrics section */}
      {data.metrics && (
        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Telemetría en Vivo</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 block">Registros:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {(data.metrics.processedRecords ?? data.metrics.recordsProcessed ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 block">Duración:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {data.metrics.durationMs ?? data.metrics.executionTimeMs ?? 0} ms
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
