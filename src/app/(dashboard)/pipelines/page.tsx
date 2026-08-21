"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/atoms/ActionButton";
import { StatusBadge, ExecutionStatus } from "@/components/atoms/StatusBadge";
import { MetricCard } from "@/components/molecules/MetricCard";
import { executionApi } from "@/services/api";
import { PipelineDAGPayload } from "@/types/pipeline";
import { AppNavbar } from "@/components/organisms/AppNavbar";
import {
  Layers,
  Plus,
  Play,
  ArrowRight,
  Search,
  CheckCircle2,
  Activity,
  Database,
  RefreshCw,
} from "lucide-react";

interface PipelineItem {
  id: string;
  name: string;
  description: string;
  status: ExecutionStatus;
  nodesCount: number;
  lastRun: string;
  sampleDAG: PipelineDAGPayload;
}

const SAMPLE_PIPELINES: PipelineItem[] = [
  {
    id: "etl-sales-sync",
    name: "Sincronización de Ventas PostgreSQL -> BigQuery",
    description: "Extracción continua de transacciones e ingesta comprimida en Parquet.",
    status: "COMPLETED",
    nodesCount: 3,
    lastRun: "Hace 10 minutos",
    sampleDAG: {
      pipeline_id: "etl-sales-sync",
      nodes: [
        {
          id: "node-1",
          type: "customETLNode",
          position: { x: 100, y: 150 },
          data: {
            label: "Extractor Postgres Sales",
            type: "extractor",
            config: { tableName: "sales_orders", batchSize: 5000 },
          },
        },
        {
          id: "node-2",
          type: "customETLNode",
          position: { x: 450, y: 150 },
          data: {
            label: "Transformador Mapeo JSON",
            type: "transformer",
            config: { transformFunction: "clean_currency_fields" },
          },
        },
        {
          id: "node-3",
          type: "customETLNode",
          position: { x: 800, y: 150 },
          data: {
            label: "Cargador BigQuery Target",
            type: "loader",
            config: { destinationType: "BigQuery", tableName: "analytics.fact_sales" },
          },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
      ],
    },
  },
  {
    id: "etl-user-segmentation",
    name: "Segmentación de Usuarios & ML Pipeline",
    description: "Clasificación de comportamiento de clientes con métricas de retención.",
    status: "RUNNING",
    nodesCount: 3,
    lastRun: "En curso",
    sampleDAG: {
      pipeline_id: "etl-user-segmentation",
      nodes: [
        {
          id: "node-1",
          type: "customETLNode",
          position: { x: 100, y: 150 },
          data: {
            label: "Extractor Eventos Redis",
            type: "extractor",
            config: { tableName: "user_activity_stream" },
          },
        },
        {
          id: "node-2",
          type: "customETLNode",
          position: { x: 450, y: 150 },
          data: {
            label: "Transformador ML Encoders",
            type: "transformer",
            config: { transformFunction: "vectorize_features" },
          },
        },
        {
          id: "node-3",
          type: "customETLNode",
          position: { x: 800, y: 150 },
          data: {
            label: "Cargador Data Lake S3",
            type: "loader",
            config: { destinationType: "AWS S3" },
          },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
      ],
    },
  },
  {
    id: "etl-inventory-cleanup",
    name: "Depuración Diaria de Inventarios",
    description: "Recalculo de stock disponible y conciliación de almacenes.",
    status: "PENDING",
    nodesCount: 3,
    lastRun: "Programado",
    sampleDAG: {
      pipeline_id: "etl-inventory-cleanup",
      nodes: [
        {
          id: "node-1",
          type: "customETLNode",
          position: { x: 100, y: 150 },
          data: {
            label: "Extractor Stock ERP",
            type: "extractor",
            config: { tableName: "inventory_items" },
          },
        },
        {
          id: "node-2",
          type: "customETLNode",
          position: { x: 450, y: 150 },
          data: {
            label: "Transformador Conciliación",
            type: "transformer",
            config: { transformFunction: "calculate_delta" },
          },
        },
        {
          id: "node-3",
          type: "customETLNode",
          position: { x: 800, y: 150 },
          data: {
            label: "Cargador Redis Cache",
            type: "loader",
            config: { destinationType: "Redis" },
          },
        },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
      ],
    },
  },
];

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines] = useState<PipelineItem[]>(SAMPLE_PIPELINES);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch =
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || pipeline.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleLaunchExecution = async (pipeline: PipelineItem) => {
    setDispatchingId(pipeline.id);
    try {
      // Despachar ejecución a FastAPI vía API REST HTTP 202
      const res = await executionApi.dispatchExecution(pipeline.sampleDAG);
      if (res?.execution_id) {
        // Redirigir a la vista de ejecución en tiempo real
        router.push(`/executions/${res.execution_id}`);
      } else {
        router.push(`/executions/${pipeline.id}`);
      }
    } catch {
      // Fallback a vista de ejecución en caso de error de conexión local
      router.push(`/executions/${pipeline.id}`);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar />

      <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Pipelines ETL
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Gestiona, construye y ejecuta tus flujos de datos automatizados en tiempo real.
            </p>
          </div>
          <Link href="/executions/new">
            <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>
              Nuevo Pipeline
            </ActionButton>
          </Link>
        </div>

        {/* Métricas Globales del Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in-up animation-delay-75">
          <MetricCard
            title="Pipelines Totales"
            value={pipelines.length}
            icon={<Layers className="w-5 h-5 text-blue-500" />}
            variant="info"
          />
          <MetricCard
            title="Ejecuciones Activas"
            value={pipelines.filter((p) => p.status === "RUNNING").length}
            icon={<Activity className="w-5 h-5 text-amber-500" />}
            variant="warning"
          />
          <MetricCard
            title="Tasa de Éxito"
            value="98.5"
            unit="%"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            variant="success"
          />
          <MetricCard
            title="Registros Procesados"
            value="1.2M"
            unit="filas/día"
            icon={<Database className="w-5 h-5 text-purple-500" />}
            variant="neutral"
          />
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-fade-in-up animation-delay-150">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDING">PENDING</option>
              <option value="RUNNING">RUNNING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Lista de Pipelines */}
        <div className="grid grid-cols-1 gap-4 animate-fade-in-up animation-delay-225">
        {filteredPipelines.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Layers className="w-10 h-10 mx-auto text-zinc-400 mb-2 stroke-1" />
            <p className="font-semibold text-sm">No se encontraron pipelines</p>
            <p className="text-xs mt-1">Prueba cambiando el término de búsqueda o el filtro de estado.</p>
          </div>
        ) : (
          filteredPipelines.map((pipeline) => {
            const isLaunching = dispatchingId === pipeline.id;

            return (
              <div
                key={pipeline.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {pipeline.name}
                      </h2>
                      <StatusBadge status={pipeline.status} size="sm" />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      {pipeline.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
                      <span>ID: {pipeline.id}</span>
                      <span>•</span>
                      <span>{pipeline.nodesCount} Nodos ETL</span>
                      <span>•</span>
                      <span>Última corrida: {pipeline.lastRun}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <ActionButton
                    variant="primary"
                    size="sm"
                    disabled={isLaunching}
                    onClick={() => handleLaunchExecution(pipeline)}
                    icon={
                      isLaunching ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )
                    }
                  >
                    {isLaunching ? "Despachando..." : "Ejecutar Ahora"}
                  </ActionButton>

                  <Link href={`/executions/${pipeline.id}`}>
                    <ActionButton
                      variant="outline"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      iconPosition="right"
                    >
                      Abrir Canvas
                    </ActionButton>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
  );
}
