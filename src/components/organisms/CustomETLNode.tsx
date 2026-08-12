"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database, Cpu, UploadCloud, AlertCircle } from "lucide-react";
import { StatusBadge, ExecutionStatus } from "@/components/atoms/StatusBadge";
import { ETLNodeData, ETLNodeType, ETLNode } from "@/types/pipeline";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  extractor: Database,
  transformer: Cpu,
  loader: UploadCloud,
};

const statusStyles: Record<ExecutionStatus, string> = {
  PENDING: "border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/70 opacity-90",
  RUNNING:
    "border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/30 shadow-md animate-pulse-glow",
  COMPLETED:
    "border-emerald-500 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm",
  FAILED:
    "border-rose-500 dark:border-rose-400 bg-rose-50/40 dark:bg-rose-950/30 ring-2 ring-rose-500/20 shadow-sm",
};

export const CustomETLNode = memo(({ data, selected }: NodeProps<ETLNode>) => {
  const nodeData = data as ETLNodeData;
  const status: ExecutionStatus = nodeData?.status || "PENDING";
  const nodeType: ETLNodeType | string = nodeData?.type || "extractor";

  const IconComponent = iconMap[nodeType.toLowerCase()] || Database;

  const records = nodeData?.metrics?.processedRecords ?? nodeData?.metrics?.recordsProcessed;
  const duration = nodeData?.metrics?.durationMs ?? nodeData?.metrics?.executionTimeMs;

  return (
    <div
      className={twMerge(
        clsx(
          "relative min-w-[240px] max-w-[280px] rounded-xl border bg-white dark:bg-zinc-900 p-3.5 shadow-sm transition-all duration-200 select-none",
          statusStyles[status] || statusStyles.PENDING,
          selected && "ring-2 ring-zinc-900 dark:ring-zinc-100 border-transparent shadow-md"
        )
      )}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 rounded-full transition-transform hover:scale-125 !-top-2"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {nodeData?.label || "Nodo ETL"}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 capitalize truncate">
              {nodeType}
            </span>
          </div>
        </div>

        <StatusBadge status={status} size="sm" showIcon={false} />
      </div>

      {/* Description */}
      {nodeData?.description && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
          {nodeData.description}
        </p>
      )}

      {/* Live Metrics */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
        <div>
          <span className="text-zinc-400">Regs: </span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {records !== undefined ? records.toLocaleString() : "0"}
          </span>
        </div>

        {duration !== undefined && duration > 0 && (
          <div>
            <span className="text-zinc-400">Tiempo: </span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`}
            </span>
          </div>
        )}
      </div>

      {/* Error Message alert */}
      {status === "FAILED" && nodeData?.errorMessage && (
        <div className="mt-2 flex items-start gap-1.5 p-1.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px]">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span className="line-clamp-2 font-mono">{nodeData.errorMessage}</span>
        </div>
      )}

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 bg-white dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-500 rounded-full transition-transform hover:scale-125 !-bottom-2"
      />
    </div>
  );
});

CustomETLNode.displayName = "CustomETLNode";
