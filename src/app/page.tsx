import Link from "next/link";
import { ActionButton } from "@/components/atoms/ActionButton";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ConnectionIndicator } from "@/components/atoms/ConnectionIndicator";
import { Layers, Play, Activity, ArrowRight, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
        <Activity className="w-3.5 h-3.5" />
        <span>Pipelify ETL Engine v1.0</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
        Orquestación de Pipelines ETL en{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
          Tiempo Real
        </span>
      </h1>

      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mb-8 leading-relaxed">
        Diseña DAGs interactivos, ejecuta transformaciones de datos distribuidas y
        monitorea la telemetría en vivo vía WebSockets y Celery.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
        <Link href="/pipelines">
          <ActionButton
            size="lg"
            variant="primary"
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            Ver Pipelines
          </ActionButton>
        </Link>
        <Link href="/executions/demo-execution-id">
          <ActionButton
            size="lg"
            variant="outline"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Explorar Ejecución
          </ActionButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Estados Visuales
            </span>
            <StatusBadge status="RUNNING" size="sm" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Transiciones reactivas inmediatas de PENDING a RUNNING, COMPLETED o FAILED.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Telemetría WebSocket
            </span>
            <ConnectionIndicator status="LIVE" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Conexión en vivo con reconexión automática y heartbeat Ping/Pong.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Motor Asíncrono
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Backend alimentado por FastAPI 0.111, Celery 5.4 y Upstash Redis Pub/Sub.
          </p>
        </div>
      </div>
    </main>
  );
}
