"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogViewerRow } from "@/components/molecules/LogViewerRow";
import { ExecutionLog, LogLevel } from "@/types/pipeline";
import { Trash2, ArrowDownCircle, Search } from "lucide-react";
import { ActionButton } from "@/components/atoms/ActionButton";

interface ExecutionLogsTableProps {
  logs: ExecutionLog[];
  onClearLogs?: () => void;
  className?: string;
}

export function ExecutionLogsTable({
  logs,
  onClearLogs,
  className,
}: ExecutionLogsTableProps) {
  const [filterLevel, setFilterLevel] = useState<LogLevel | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesSearch =
      !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div
      className={`w-full bg-zinc-950 text-zinc-100 font-mono text-xs rounded-lg border border-zinc-800 shadow-lg overflow-hidden flex flex-col ${
        className || ""
      }`}
    >
      {/* Console Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-200">Consola de Ejecución</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {filteredLogs.length} registros
          </span>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2">
          {/* Level Filter dropdown */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as LogLevel | "ALL")}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="ALL">TODOS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SUCCESS">SUCCESS</option>
          </select>

          {/* Search Input */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded pl-7 pr-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            title={autoScroll ? "Desactivar Auto-Scroll" : "Activar Auto-Scroll"}
            className={`p-1.5 rounded transition-colors ${
              autoScroll
                ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800"
                : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs Button */}
          {onClearLogs && (
            <ActionButton
              variant="outline"
              size="sm"
              onClick={onClearLogs}
              className="!py-1 !px-2 text-[11px] border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Limpiar
            </ActionButton>
          )}
        </div>
      </div>

      {/* Logs Stream Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 console-scrollbar min-h-[160px] max-h-[300px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-zinc-600 font-sans text-xs select-none">
            No se han registrado eventos en la consola.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <LogViewerRow
              key={log.id}
              timestamp={log.timestamp}
              level={log.level}
              message={log.message}
            />
          ))
        )}
      </div>
    </div>
  );
}
