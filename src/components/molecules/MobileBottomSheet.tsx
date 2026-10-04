"use client";

import React, { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import { X, Activity, Database, Cpu, UploadCloud, Trash2, Check } from "lucide-react";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ETLNodeData, ETLNodeType } from "@/types/pipeline";

interface MobileBottomSheetProps {
  node: Node<ETLNodeData> | null;
  onUpdateConfig?: (
    nodeId: string,
    config: Record<string, any>,
    label?: string,
    description?: string
  ) => void;
  onUpdateNode?: (
    nodeId: string,
    updates: {
      label?: string;
      description?: string;
      config?: Record<string, any>;
    }
  ) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose: () => void;
  className?: string;
}

const WRITE_MODES = [
  { value: "UPSERT", label: "UPSERT" },
  { value: "APPEND", label: "APPEND" },
  { value: "REPLACE", label: "REPLACE" },
  { value: "MERGE", label: "MERGE" },
];

const SOURCE_TYPES = [
  { value: "PostgreSQL", label: "PostgreSQL Database" },
  { value: "MySQL", label: "MySQL Database" },
  { value: "REST_API", label: "REST API / Webhook" },
  { value: "S3_Bucket", label: "Amazon S3 / Blob Storage" },
  { value: "MongoDB", label: "MongoDB NoSQL" },
  { value: "CSV_File", label: "CSV / Archivo Local" },
];

export function MobileBottomSheet({
  node,
  onUpdateConfig,
  onUpdateNode,
  onDeleteNode,
  onClose,
  className,
}: MobileBottomSheetProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [tableName, setTableName] = useState("");
  const [writeMode, setWriteMode] = useState("UPSERT");
  const [batchSize, setBatchSize] = useState<number>(1000);
  const [timeoutSec, setTimeoutSec] = useState<number>(30);
  const [retryAttempts, setRetryAttempts] = useState<number>(3);
  const [sourceType, setSourceType] = useState("PostgreSQL");
  const [transformFunction, setTransformFunction] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (node) {
      const data = node.data as ETLNodeData;
      setLabel(data.label || "");
      setDescription(data.description || "");
      setTableName(data.config?.tableName || "");
      setWriteMode(data.config?.writeMode || "UPSERT");
      setBatchSize(data.config?.batchSize ?? 1000);
      setTimeoutSec(data.config?.timeoutSec ?? 30);
      setRetryAttempts(data.config?.retryAttempts ?? 3);
      setSourceType(data.config?.sourceType || "PostgreSQL");
      setTransformFunction(data.config?.transformFunction || "");
      setSavedSuccess(false);
    }
  }, [node]);

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: Record<string, any> = {
      batchSize: Number(batchSize),
      timeoutSec: Number(timeoutSec),
      retryAttempts: Number(retryAttempts),
      ...(nodeType === "extractor"
        ? {
            sourceType,
            tableName,
          }
        : {}),
      ...(nodeType === "transformer"
        ? {
            transformFunction,
          }
        : {}),
      ...(nodeType === "loader"
        ? {
            tableName,
            writeMode,
          }
        : {}),
    };

    if (onUpdateNode) {
      onUpdateNode(node.id, {
        label,
        description,
        config: updatedConfig,
      });
    } else if (onUpdateConfig) {
      onUpdateConfig(node.id, updatedConfig, label, description);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-bottom-sheet-title"
        className={`relative z-10 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 max-h-[85vh] overflow-y-auto flex flex-col ${
          className || ""
        }`}
      >
        {/* Touch Drag Handle */}
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0 cursor-grab" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3
                id="mobile-bottom-sheet-title"
                className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate"
              >
                {data.label || "Nodo Seleccionado"}
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">ID: {node.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={data.status || "PENDING"} size="sm" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de configuración móvil"
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
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

        {/* Interactive Editing Form */}
        <form onSubmit={handleSave} className="space-y-3 pb-2 text-xs">
          <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
            Edición de Parámetros
          </h4>

          {/* Nombre / Label */}
          <div>
            <label
              htmlFor={`mobile-node-label-${node.id}`}
              className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Nombre del Nodo
            </label>
            <input
              id={`mobile-node-label-${node.id}`}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor={`mobile-node-desc-${node.id}`}
              className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Descripción
            </label>
            <input
              id={`mobile-node-desc-${node.id}`}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del nodo"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>

          {/* Extractor Specific */}
          {nodeType === "extractor" && (
            <>
              <div>
                <label
                  htmlFor={`mobile-node-source-${node.id}`}
                  className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Tipo de Origen
                </label>
                <select
                  id={`mobile-node-source-${node.id}`}
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  {SOURCE_TYPES.map((src) => (
                    <option key={src.value} value={src.value}>
                      {src.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`mobile-node-table-${node.id}`}
                  className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Tabla / Endpoint Origen
                </label>
                <input
                  id={`mobile-node-table-${node.id}`}
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. sales_orders"
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                />
              </div>
            </>
          )}

          {/* Transformer Specific */}
          {nodeType === "transformer" && (
            <div>
              <label
                htmlFor={`mobile-node-func-${node.id}`}
                className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Función de Transformación
              </label>
              <input
                id={`mobile-node-func-${node.id}`}
                type="text"
                value={transformFunction}
                onChange={(e) => setTransformFunction(e.target.value)}
                placeholder="e.g. clean_currency_fields"
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
          )}

          {/* Loader Specific */}
          {nodeType === "loader" && (
            <>
              <div>
                <label
                  htmlFor={`mobile-node-table-${node.id}`}
                  className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Tabla Destino
                </label>
                <input
                  id={`mobile-node-table-${node.id}`}
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. analytics.fact_sales"
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                />
              </div>

              <div>
                <label
                  htmlFor={`mobile-node-writemode-${node.id}`}
                  className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Modo de Escritura (Write Mode)
                </label>
                <select
                  id={`mobile-node-writemode-${node.id}`}
                  value={writeMode}
                  onChange={(e) => setWriteMode(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  {WRITE_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* General: Batch Size & Timeout */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor={`mobile-node-batch-${node.id}`}
                className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Tamaño Lote
              </label>
              <input
                id={`mobile-node-batch-${node.id}`}
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>

            <div>
              <label
                htmlFor={`mobile-node-timeout-${node.id}`}
                className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Timeout (s)
              </label>
              <input
                id={`mobile-node-timeout-${node.id}`}
                type="number"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors touch-manipulation flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Cambios Guardados!</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>

            {onDeleteNode && (
              <button
                type="button"
                onClick={() => {
                  onDeleteNode(node.id);
                  onClose();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Nodo del Pipeline</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
