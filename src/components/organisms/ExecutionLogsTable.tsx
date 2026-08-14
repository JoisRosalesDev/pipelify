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
    if (!isMinimized && autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
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
        isMinimized ? "h-10" : "h-full"
      } ${className || ""}`}
    >
      {/* Console Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 select-none shrink-0 h-10">
        <div
          onClick={handleToggle}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Consola de Ejecución</span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {filteredLogs.length} eventos
          </span>

          <span className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5">
            {isMinimized ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expandir</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Minimizar</span>
              </>
            )}
          </span>
        </div>

        {/* Filters and Controls (hidden when minimized) */}
        {!isMinimized && (
          <div className="flex items-center gap-2">
            {/* Level Filter dropdown */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | "ALL")}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded pl-7 pr-2 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {/* Auto-Scroll Toggle */}
            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              title={autoScroll ? "Desactivar Auto-Scroll" : "Activar Auto-Scroll"}
              className={`p-1 rounded transition-colors ${
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
                className="!py-0.5 !px-2 text-[11px] border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Limpiar
              </ActionButton>
            )}

            {/* Minimize button */}
            <button
              onClick={handleToggle}
              title="Minimizar consola"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Logs Stream Container */}
      {!isMinimized && (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-2 console-scrollbar min-h-0"
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
      )}
    </div>
  );
}
