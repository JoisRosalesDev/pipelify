"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";

export default function ExecutionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Execution Canvas Error:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-lg w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-zinc-900 p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-8 ring-rose-500/10">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            Fallo en el Lienzo de Ejecución
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ocurrió un error al procesar la telemetría reactiva o al renderizar el grafo DAG.
          </p>
        </div>

        {error?.message && (
          <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 text-left font-mono text-xs text-rose-700 dark:text-rose-300 break-words overflow-x-auto max-h-40">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Recargar Lienzo</span>
          </button>

          <Link
            href="/pipelines"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl font-medium text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Lista de Pipelines</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
