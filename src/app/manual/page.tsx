"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/organisms/AppNavbar";
import { ActionButton } from "@/components/atoms/ActionButton";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { MetricCard } from "@/components/molecules/MetricCard";
import { MANUAL_USE_CASES, ManualUseCase, ManualStep } from "@/types/manual";
import {
  BookOpen,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  Activity,
  Database,
  Terminal,
  Sparkles,
  Settings2,
  Info,
  ExternalLink,
  Code2,
  Server,
} from "lucide-react";

export default function ManualPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    MANUAL_USE_CASES[0].id
  );

  const activeCase: ManualUseCase =
    MANUAL_USE_CASES.find((c) => c.id === selectedCaseId) || MANUAL_USE_CASES[0];

  const getStageIcon = (stage: ManualStep["stage"]) => {
    switch (stage) {
      case "extractor":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "transformer":
        return <Settings2 className="w-4 h-4 text-purple-500" />;
      case "loader":
        return <Server className="w-4 h-4 text-emerald-500" />;
      case "telemetry":
        return <Activity className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStageBadgeLabel = (stage: ManualStep["stage"]) => {
    switch (stage) {
      case "extractor":
        return "1. Extracción (E)";
      case "transformer":
        return "2. Transformación (T)";
      case "loader":
        return "3. Carga (L)";
      case "telemetry":
        return "4. Telemetría y Monitoreo";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Header Hero */}
        <div className="flex flex-col items-start gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-6 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guía Práctica de Arquitectura</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Manual de Orquestación y{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              Casos de Uso ETL
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            Explora la arquitectura técnica, configuración de nodos y monitoreo reactivo de los 3
            patrones fundamentales de ingeniería de datos integrados en Pipelify.
          </p>
        </div>

        {/* Selector de los 3 Casos de Uso (Pills / Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up animation-delay-75">
          {MANUAL_USE_CASES.map((useCase) => {
            const isSelected = useCase.id === selectedCaseId;
            return (
              <button
                key={useCase.id}
                onClick={() => setSelectedCaseId(useCase.id)}
                className={`text-left p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 border-blue-500 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/50">
                      {useCase.category}
                    </span>
                    <StatusBadge status={useCase.status} size="sm" />
                  </div>

                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {useCase.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {useCase.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-blue-600 dark:text-blue-400 pt-4 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span>Ver Paso a Paso</span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? "translate-x-1" : ""
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle del Caso Seleccionado */}
        <section
          key={activeCase.id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 animate-scale-in animation-delay-150"
        >
          {/* Encabezado del Caso de Uso Activo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  ID: {activeCase.pipelineId}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Totalmente Implementado
                </span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {activeCase.title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {activeCase.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link href={`/executions/${activeCase.pipelineId}`}>
                <ActionButton
                  variant="primary"
                  icon={<Play className="w-4 h-4 fill-current" />}
                >
                  Abrir en Canvas
                </ActionButton>
              </Link>
              <Link href="/pipelines">
                <ActionButton
                  variant="outline"
                  icon={<ExternalLink className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Ver en Lista
                </ActionButton>
              </Link>
            </div>
          </div>

          {/* Diagrama de Flujo Arquitectónico Simplificado */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Flujo de Nodos del DAG</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {activeCase.architectureNodes.map((node, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {getStageIcon(node.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {node.label}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      {node.tech}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas Clave del Pipeline */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Métricas Operativas Esperadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeCase.metricsSummary.map((metric, idx) => (
                <MetricCard
                  key={idx}
                  title={metric.label}
                  value={metric.value}
                  unit={metric.unit}
                  icon={<Activity className="w-4 h-4 text-blue-500" />}
                  variant="neutral"
                />
              ))}
            </div>
          </div>

          {/* Guía Paso a Paso Detallada */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>Instrucciones y Paso a Paso</span>
            </h3>

            <div className="space-y-6">
              {activeCase.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-4"
                >
                  {/* Encabezado del Paso */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {step.stepNumber}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {step.title}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium self-start sm:self-auto">
                      {getStageIcon(step.stage)}
                      <span>{getStageBadgeLabel(step.stage)}</span>
                    </div>
                  </div>

                  {/* Explicación textual */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Configuración Clave / Resumen */}
                  {step.configSummary && (
                    <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
                        Parámetros de Configuración del Nodo:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(step.configSummary).map(([key, val]) => (
                          <div
                            key={key}
                            className="bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded border border-zinc-100 dark:border-zinc-700 font-mono text-[11px]"
                          >
                            <span className="text-zinc-400 dark:text-zinc-500 block">
                              {key}:
                            </span>
                            <span className="text-zinc-900 dark:text-zinc-200 font-bold truncate block">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Snippet de Código / JSON */}
                  {step.codeSnippet && (
                    <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 text-zinc-400 text-[11px] font-mono border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Especificación Técnica / Código</span>
                        </div>
                        <span>JSON / Python</span>
                      </div>
                      <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto console-scrollbar leading-relaxed">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Consejo / Tip de Producción */}
                  {step.tips && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300">
                      <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <span>
                        <strong className="font-semibold">Recomendación de Producción: </strong>
                        {step.tips}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botón de Ejecución Directa en el Pie de la Ficha */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                ¿Deseas probar este flujo en tiempo real?
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Abre el canvas con la configuración precargada de este caso de uso y despacha la ejecución.
              </p>
            </div>
            <Link href={`/executions/${activeCase.pipelineId}`} className="shrink-0 w-full sm:w-auto">
              <ActionButton
                variant="primary"
                fullWidth
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Abrir Canvas de {activeCase.title.split(" ")[0]}
              </ActionButton>
            </Link>
          </div>
        </section>

        {/* Footer Navigation Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up animation-delay-225">
          <Link
            href="/pipelines"
            className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Ver Todos los Pipelines
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Explora la lista consolidada de DAGs activos y sus estados.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/executions/new"
            className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Crear Nuevo Pipeline
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Diseña un DAG personalizado desde cero con React Flow.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
    </div>
  );
}
