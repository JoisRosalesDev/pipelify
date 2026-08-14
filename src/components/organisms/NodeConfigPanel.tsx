"use client";

import React, { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import {
  X,
  Settings,
  Database,
  Cpu,
  UploadCloud,
  Activity,
  Server,
  Filter,
  Layers,
  FileCode,
  HardDrive,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { ETLNodeData, ETLNodeType } from "@/types/pipeline";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ActionButton } from "@/components/atoms/ActionButton";

interface NodeConfigPanelProps {
  node: Node<ETLNodeData> | null;
  onUpdateConfig: (nodeId: string, config: Record<string, any>, label?: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose: () => void;
  className?: string;
}

const SOURCE_TYPES = [
  { value: "PostgreSQL", label: "PostgreSQL Database" },
  { value: "MySQL", label: "MySQL Database" },
  { value: "REST_API", label: "REST API / Webhook" },
  { value: "S3_Bucket", label: "Amazon S3 / Blob Storage" },
  { value: "MongoDB", label: "MongoDB NoSQL" },
  { value: "CSV_File", label: "CSV / Archivo Local" },
];

const TRANSFORMATION_TYPES = [
  { value: "CLEAN_NORMALIZE", label: "Normalización & Limpieza" },
  { value: "CURRENCY_FORMAT", label: "Conversión de Moneda & Fechas" },
  { value: "AGGREGATION_DEDUP", label: "Deduplicación & Agregación" },
  { value: "SCHEMA_VALIDATION", label: "Validación de Esquema Zod" },
  { value: "CUSTOM_SCRIPT", label: "Script Python Personalizado" },
];

const DESTINATION_TYPES = [
  { value: "PostgreSQL_DW", label: "PostgreSQL Data Warehouse" },
  { value: "BigQuery", label: "Google BigQuery" },
  { value: "Snowflake", label: "Snowflake Cloud DW" },
  { value: "ClickHouse", label: "ClickHouse OLAP" },
  { value: "S3_Parquet", label: "Amazon S3 (Parquet)" },
  { value: "Redis_Cache", label: "Redis Cache Key-Value" },
  { value: "Webhook_Target", label: "Webhook / HTTP Endpoint" },
];

const WRITE_MODES = [
  { value: "UPSERT", label: "UPSERT (Insertar o Actualizar por Clave)" },
  { value: "APPEND", label: "APPEND (Insertar al final de la tabla)" },
  { value: "REPLACE", label: "REPLACE (Truncar tabla y reescribir)" },
  { value: "MERGE", label: "MERGE (Fusión condicional)" },
];

export function NodeConfigPanel({
  node,
  onUpdateConfig,
  onDeleteNode,
  onClose,
  className,
}: NodeConfigPanelProps) {
  const [label, setLabel] = useState("");
  const [batchSize, setBatchSize] = useState<number>(1000);
  const [retryAttempts, setRetryAttempts] = useState<number>(3);
  const [timeoutSec, setTimeoutSec] = useState<number>(30);

  // Extractor specific
  const [sourceType, setSourceType] = useState("PostgreSQL");
  const [queryFilter, setQueryFilter] = useState("");
  const [extractionLimit, setExtractionLimit] = useState<number>(10000);

  // Transformer specific
  const [transformationType, setTransformationType] = useState("CLEAN_NORMALIZE");
  const [transformFunction, setTransformFunction] = useState("");
  const [forceFail, setForceFail] = useState(false);

  // Loader specific
  const [destinationType, setDestinationType] = useState("BigQuery");
  const [tableName, setTableName] = useState("");
  const [writeMode, setWriteMode] = useState("UPSERT");

  useEffect(() => {
    if (node) {
      const data = node.data as ETLNodeData;
      setLabel(data.label || "");
      setBatchSize(data.config?.batchSize || 1000);
      setRetryAttempts(data.config?.retryAttempts || 3);
      setTimeoutSec(data.config?.timeoutSec || 30);

      // Extractor
      setSourceType(data.config?.sourceType || "PostgreSQL");
      setQueryFilter(data.config?.queryFilter || "");
      setExtractionLimit(data.config?.extractionLimit || 10000);

      // Transformer
      setTransformationType(data.config?.transformationType || "CLEAN_NORMALIZE");
      setTransformFunction(data.config?.transformFunction || "");
      setForceFail(Boolean(data.config?.force_fail || data.config?.forceFail));

      // Loader
      setDestinationType(data.config?.destinationType || "BigQuery");
      setTableName(data.config?.tableName || "");
      setWriteMode(data.config?.writeMode || "UPSERT");
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
        ...(nodeType === "extractor"
          ? {
              sourceType,
              tableName,
              queryFilter,
              extractionLimit: Number(extractionLimit),
            }
          : {}),
        ...(nodeType === "transformer"
          ? {
              transformationType,
              transformFunction,
              force_fail: forceFail,
            }
          : {}),
        ...(nodeType === "loader"
          ? {
              destinationType,
              tableName,
              writeMode,
            }
          : {}),
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
      {/* Header del Panel */}
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

      {/* Badge de Tipo y Estado */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-300">
            Tipo: {nodeType}
          </span>
        </div>
        <StatusBadge status={data.status || "PENDING"} size="sm" />
      </div>

      {/* Formulario de Configuración Específica */}
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

        {/* ===================================================================
            CAMPOS ESPECÍFICOS PARA EXTRACTOR (ORIGEN / SOURCE)
        =================================================================== */}
        {nodeType === "extractor" && (
          <>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tipo de Conexión / Origen
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              >
                {SOURCE_TYPES.map((src) => (
                  <option key={src.value} value={src.value}>
                    {src.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tabla / Endpoint / Ruta Origen
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. public.sales_orders o /v1/transactions"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Filtro SQL / Query Params (WHERE)
              </label>
              <input
                type="text"
                value={queryFilter}
                onChange={(e) => setQueryFilter(e.target.value)}
                placeholder="e.g. status = 'completed' AND date >= '2026-01-01'"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Límite de Extracción (Max Rows)
              </label>
              <input
                type="number"
                value={extractionLimit}
                onChange={(e) => setExtractionLimit(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
          </>
        )}

        {/* ===================================================================
            CAMPOS ESPECÍFICOS PARA TRANSFORMER (PROCESAMIENTO)
        =================================================================== */}
        {nodeType === "transformer" && (
          <>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tipo de Transformación
              </label>
              <select
                value={transformationType}
                onChange={(e) => setTransformationType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              >
                {TRANSFORMATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Función / Script de Transformación
              </label>
              <input
                type="text"
                value={transformFunction}
                onChange={(e) => setTransformFunction(e.target.value)}
                placeholder="e.g. clean_currency_fields o normalize_dates"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-[11px]"
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
              <label
                htmlFor="forceFailCheckbox"
                className="font-medium text-red-700 dark:text-red-300 text-[11px] cursor-pointer"
              >
                Simular Fallo Crítico (Test Circuit Breaker)
              </label>
            </div>
          </>
        )}

        {/* ===================================================================
            CAMPOS ESPECÍFICOS PARA LOADER (DESTINO / TARGET)
        =================================================================== */}
        {nodeType === "loader" && (
          <>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Destino / Target Data Warehouse
              </label>
              <select
                value={destinationType}
                onChange={(e) => setDestinationType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              >
                {DESTINATION_TYPES.map((dst) => (
                  <option key={dst.value} value={dst.value}>
                    {dst.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tabla / Colección Destino Target
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. analytics.fact_sales_daily"
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Estrategia de Escritura (Write Mode)
              </label>
              <select
                value={writeMode}
                onChange={(e) => setWriteMode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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

        {/* ===================================================================
            CAMPOS GENERALES (BATCH, REINTENTOS, TIMEOUT)
        =================================================================== */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
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
            Timeout de Ejecución (Segundos)
          </label>
          <input
            type="number"
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <ActionButton type="submit" variant="primary" className="flex-1">
            Guardar Cambios
          </ActionButton>

          {onDeleteNode && (
            <button
              type="button"
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              title="Eliminar nodo del lienzo"
              className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 transition-colors shrink-0 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Sección de Telemetría en Vivo del Nodo */}
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
