"use client";

import React from "react";
import { StatusBadge, ExecutionStatus } from "@/components/atoms/StatusBadge";
import {
  ConnectionIndicator,
  WebSocketConnectionStatus,
} from "@/components/atoms/ConnectionIndicator";
import { GitCommit, Layers, Clock } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface PipelineInfoBannerProps {
  pipelineId: string;
  executionId?: string;
  status: ExecutionStatus | string;
  wsStatus: WebSocketConnectionStatus;
  totalNodes?: number;
  duration?: string;
  className?: string;
}

export function PipelineInfoBanner({
  pipelineId,
  executionId,
  status,
  wsStatus,
  totalNodes,
  duration,
  className,
}: PipelineInfoBannerProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm",
          className
        )
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {pipelineId}
            </h1>
            <StatusBadge status={status} size="sm" />
          </div>
          {executionId && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              <GitCommit className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">exec: {executionId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {totalNodes !== undefined && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
            <Layers className="w-3.5 h-3.5" />
            <span>{totalNodes} Nodos</span>
          </div>
        )}

        {duration && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
        )}

        <ConnectionIndicator status={wsStatus} />
      </div>
    </div>
  );
}
