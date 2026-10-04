"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogViewerRow } from "@/components/molecules/LogViewerRow";
import { ExecutionLog, LogLevel } from "@/types/pipeline";
import {
  Trash2,
  ArrowDownCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";
import { ActionButton } from "@/components/atoms/ActionButton";

interface ExecutionLogsTableProps {
  logs: ExecutionLog[];
  onClearLogs?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export function ExecutionLogsTable({
  logs,
  onClearLogs,
  isMinimized: controlledMinimized,
  onToggleMinimize,
  className,
}: ExecutionLogsTableProps) {
  const [internalMinimized, setInternalMinimized] = useState(false);
  const [filterLevel, setFilterLevel] = useState<LogLevel | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMinimized =
    controlledMinimized !== undefined ? controlledMinimized : internalMinimized;

  const handleToggle = () => {
    if (onToggleMinimize) {
      onToggleMinimize();
    } else {
      setInternalMinimized((prev) => !prev);
    }
  };

  useEffect(() => {
    if (isMinimized || !autoScroll) return;

    const frameId = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [logs, autoScroll, isMinimized]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesSearch =
      !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div
      className={`w-full bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 shadow-xl overflow-hidden flex flex-col transition-all duration-200 ${
        isMinimized ? "h-11" : "h-full"
      } ${className || ""}`}
    >
      {/* Console Header Bar (Optimizado para Mobile - Single Line) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-3 bg-zinc-900 border-b border-zinc-800 select-none shrink-0 min-h-[44px] h-11 flex-nowrap overflow-hidden">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={!isMinimized}
          aria-controls="execution-logs-container"
          aria-label={isMinimized ? "Expandir consola de ejecución" : "Minimizar consola de ejecución"}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer hover:opacity-80 transition-opacity shrink-0 min-w-0 min-h-[44px] bg-transparent border-0 p-0 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 text-zinc-300 font-bold shrink-0">
            <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Consola de Ejecución</span>
            <span className="sm:hidden text-xs">Consola</span>
          </div>

          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
            {filteredLogs.length}
            <span className="hidden sm:inline"> eventos</span>
          </span>

          <span className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 shrink-0">
            {isMinimized ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden md:inline">Expandir</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden md:inline">Minimizar</span>
              </>
            )}
          </span>
        </button>

        {/* Filters and Controls (hidden when minimized) */}
        {!isMinimized && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Level Filter dropdown */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | "ALL")}
              aria-label="Filtrar por nivel de log"
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 min-h-[44px] sm:min-h-[32px] focus:outline-none focus:ring-1 focus:ring-zinc-500 max-w-[85px] sm:max-w-none"
            >
              <option value="ALL">TODOS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="SUCCESS">SUCCESS</option>
            </select>

            {/* Search Input (Hidden on mobile) */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar eventos en consola"
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded pl-8 pr-2 min-h-[32px] w-24 lg:w-32 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {/* Auto-Scroll Toggle */}
            <button
              type="button"
              onClick={() => setAutoScroll((prev) => !prev)}
              aria-label={autoScroll ? "Desactivar Auto-Scroll" : "Activar Auto-Scroll"}
              title={autoScroll ? "Desactivar Auto-Scroll" : "Activar Auto-Scroll"}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors shrink-0 ${
                autoScroll
                  ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800"
                  : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
            </button>

            {/* Clear Logs Button */}
            {onClearLogs && (
              <ActionButton
                variant="outline"
                size="sm"
                onClick={onClearLogs}
                aria-label="Limpiar eventos de la consola"
                className="min-h-[44px] min-w-[44px] !px-2.5 text-[10px] sm:text-[11px] border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0 inline-flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Limpiar</span>
              </ActionButton>
            )}

            {/* Minimize button */}
            <button
              type="button"
              onClick={handleToggle}
              aria-label={isMinimized ? "Expandir consola" : "Minimizar consola"}
              title="Minimizar consola"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Logs Stream Container */}
      {!isMinimized && (
        <div
          id="execution-logs-container"
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Registro de eventos de ejecución"
          ref={containerRef}
          className="flex-1 overflow-y-auto p-2 console-scrollbar min-h-0 text-[11px] sm:text-xs"
        >
          {filteredLogs.length === 0 ? (
            <div className="py-6 text-center text-zinc-600 font-sans text-xs select-none">
              No se han registrado eventos en la consola.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogViewerRow
                key={log.id}
                timestamp={log.timestamp}
                level={log.level}
                message={log.message}
                nodeId={log.nodeId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
