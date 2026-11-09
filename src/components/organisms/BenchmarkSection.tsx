"use client";

import React, { useState } from "react";
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BarChart2,
  Terminal,
  Activity,
  TrendingUp,
} from "lucide-react";

interface BenchmarkDataRow {
  volume: string;
  rowsCount: number;
  extractionMs: number;
  transformationMs: number;
  throughput: string;
  totalTime: string;
  isPeak?: boolean;
}

const BENCHMARK_DATA: BenchmarkDataRow[] = [
  {
    volume: "10,000",
    rowsCount: 10000,
    extractionMs: 9,
    transformationMs: 19,
    throughput: "162,209 filas/s",
    totalTime: "0.062s",
  },
  {
    volume: "50,000",
    rowsCount: 50000,
    extractionMs: 9,
    transformationMs: 17,
    throughput: "1,019,201 filas/s",
    totalTime: "0.049s",
  },
  {
    volume: "100,000",
    rowsCount: 100000,
    extractionMs: 16,
    transformationMs: 17,
    throughput: "1,764,807 filas/s",
    totalTime: "0.057s",
  },
  {
    volume: "250,000 (Pico)",
    rowsCount: 250000,
    extractionMs: 34,
    transformationMs: 19,
    throughput: "3,291,409 filas/s",
    totalTime: "0.076s",
    isPeak: true,
  },
];

export function BenchmarkSection() {
  const [activeTab, setActiveTab] = useState<"data-plane" | "control-plane">("data-plane");

  return (
    <section id="benchmarks" className="w-full mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-zinc-200 dark:border-zinc-800 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Resultados Cuantificables & Benchmarks</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Rendimiento del Motor y Resiliencia
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Pruebas reproducibles que demuestran qué resuelve Pipelify: alto rendimiento analítico en memoria y protección absoluta de infraestructura ante fallos.
          </p>
        </div>

        {/* Tab switch — Adaptativo móvil full-width con tap targets accesibles */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab("data-plane")}
            className={`px-3 py-2 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 ${
              activeTab === "data-plane"
                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Data Plane (DuckDB)</span>
          </button>
          <button
            onClick={() => setActiveTab("control-plane")}
            className={`px-3 py-2 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 ${
              activeTab === "control-plane"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Control Plane (Orquestador)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip — 1 columna en pantallas ultra estrechas, 2 en intermedias, 4 en desktop */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Throughput Pico</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            3.29M+
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            filas / segundo (DuckDB)
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Transformación SQL</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            19 ms
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            en agregaciones de 250k filas
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Validación Acíclica</span>
            <BarChart2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            O(V + E)
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            Algoritmo de Kahn
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-medium">Circuit Breaker</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            &gt; 50% fallas
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            aborto seguro + jitter backoff
          </span>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === "data-plane" ? (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>Data Plane: Procesamiento Analítico Real (OLAP)</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Reemplazo de latencias simuladas por un motor columnar en memoria (**DuckDB**). Cómputo intensivo en hilos secundarios sin bloquear el Event Loop asíncrono de FastAPI.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-2xs sm:text-xs text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-md self-start lg:self-auto max-w-full overflow-x-auto">
                <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">python backend/benchmark_data_plane.py</span>
              </div>
            </div>

            {/* Vista Móvil: Tarjetas compactas apiladas (pantallas < 640px) */}
            <div className="sm:hidden space-y-2.5 mt-4">
              {BENCHMARK_DATA.map((row) => (
                <div
                  key={row.volume}
                  className={`p-3.5 rounded-xl border text-xs ${
                    row.isPeak
                      ? "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {row.volume} filas
                    </span>
                    <span className={`px-2 py-0.5 rounded text-2xs font-mono font-bold ${
                      row.isPeak
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                    }`}>
                      {row.totalTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                    <div>
                      <span className="text-zinc-500 block">Throughput:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {row.throughput}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">SQL Agregación:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {row.transformationMs} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Extracción:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {row.extractionMs} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Carga / Sink:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        &lt; 5 ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Desktop / Tablet: Tabla completa (pantallas >= 640px) */}
            <div className="hidden sm:block overflow-x-auto mt-6">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-2xs tracking-wider">
                    <th className="py-2.5 pr-4">Volumen (Filas)</th>
                    <th className="py-2.5 px-4">Extracción</th>
                    <th className="py-2.5 px-4">Transformación SQL (Agregación)</th>
                    <th className="py-2.5 px-4">Throughput</th>
                    <th className="py-2.5 pl-4 text-right">Tiempo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  {BENCHMARK_DATA.map((row) => (
                    <tr
                      key={row.volume}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors ${
                        row.isPeak ? "bg-blue-500/5 dark:bg-blue-500/10" : ""
                      }`}
                    >
                      <td className={`py-3 pr-4 font-semibold ${row.isPeak ? "text-blue-600 dark:text-blue-400 font-bold" : "text-zinc-900 dark:text-zinc-100"}`}>
                        {row.volume}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{row.extractionMs} ms</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{row.transformationMs} ms</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {row.throughput}
                      </td>
                      <td className={`py-3 pl-4 text-right font-bold ${row.isPeak ? "text-blue-600 dark:text-blue-400 font-black" : "text-zinc-900 dark:text-zinc-200"}`}>
                        {row.totalTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recruiter takeaway */}
            <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block mb-0.5">
                  ¿Qué problema resuelve en producción?
                </strong>
                Evita la sobrecarga de memoria de frameworks como Pandas cargando DataFrames pesados en RAM. DuckDB ejecuta agregaciones analíticas vectorizadas en milisegundos con aislamiento completo por <code className="font-mono text-2xs bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">execution_id</code>.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Control Plane: Orquestación, Ciclos y Tolerancia a Fallos</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Mecanismos matemáticos y de resiliencia distribuidos ejecutados en backend (FastAPI + Celery + PostgreSQL).
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-2xs sm:text-xs text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-md self-start lg:self-auto max-w-full overflow-x-auto">
                <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">python backend/benchmark_orchestrator.py</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-5 sm:mt-6">
              {/* Kahn's Algorithm */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Ordenamiento Topológico (Kahn)
                    </span>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                      100% Verificado
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Prevención Inmediata de Bucles Infinitos
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                    Si un usuario o API intenta ejecutar un DAG con dependencias circulares (ej. A → B → C → A), el algoritmo detecta el ciclo en tiempo lineal <code className="text-purple-500 font-mono">O(V + E)</code> antes de iniciar un solo worker.
                  </p>
                </div>
                <div className="text-2xs font-mono p-2.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 break-words whitespace-pre-wrap">
                  <span className="text-rose-400">[RECHAZADO]</span> &quot;El DAG contiene ciclos dirigidos inválidos. Se requiere un Grafo Acíclico Dirigido.&quot;
                </div>
              </div>

              {/* Circuit Breaker & Jitter */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Circuit Breaker + Jitter
                    </span>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                      Tolerancia a Fallos
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Protección de Cola ante Fallas en Cascada
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                    Los nodos con fallo se reintentan aplicando <code className="text-amber-500 font-mono">t = 2^intento + uniform(0, 1)s</code>. Si la tasa de fallo global supera el 50%, el orquestador aborta la ejecución para no malgastar workers Celery.
                  </p>
                </div>
                <div className="text-2xs font-mono p-2.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 break-words whitespace-pre-wrap">
                  <span className="text-amber-400">[CIRCUIT BREAKER]</span> Nodo f-1 falló 3 intentos. Nodos downstream cancelados preventivamente.
                </div>
              </div>
            </div>

            {/* WebSocket note */}
            <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block mb-0.5">
                  Telemetría en Vivo vía WebSockets
                </strong>
                Cada cambio de estado (transiciones de nodo y logs) se emite atómicamente a través de Redis Pub/Sub con protocolo de Heartbeat (Ping/Pong cada 20s), garantizando sincronización en vivo con el lienzo React Flow.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
