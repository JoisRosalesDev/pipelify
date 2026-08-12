"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";

export interface LogViewerRowProps {
  id?: string;
  timestamp: string | Date;
  level: LogLevel | string;
  message: string;
  nodeId?: string;
  className?: string;
}

const levelConfig: Record<
  LogLevel,
  {
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    rowBorderClass: string;
  }
> = {
  INFO: {
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Info,
    rowBorderClass: "border-l-blue-500",
  },
  WARN: {
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: AlertTriangle,
    rowBorderClass: "border-l-amber-500",
  },
  ERROR: {
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: AlertCircle,
    rowBorderClass: "border-l-rose-500",
  },
  SUCCESS: {
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
    rowBorderClass: "border-l-emerald-500",
  },
};

function formatTimestamp(ts: string | Date): string {
  try {
    const d = typeof ts === "string" ? new Date(ts) : ts;
    if (isNaN(d.getTime())) return String(ts);
    return d.toISOString().substring(11, 23); // HH:mm:ss.sss
  } catch {
    return String(ts);
  }
}

export function LogViewerRow({
  timestamp,
  level,
  message,
  nodeId,
  className,
}: LogViewerRowProps) {
  const normalizedLevel = (
    typeof level === "string" ? level.toUpperCase() : "INFO"
  ) as LogLevel;

  const config = levelConfig[normalizedLevel] || levelConfig.INFO;
  const IconComponent = config.icon;
  const formattedTime = formatTimestamp(timestamp);

  return (
    <div
      className={twMerge(
        clsx(
          "flex items-start gap-2.5 px-3 py-1.5 font-mono text-xs border-l-2 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors group select-text",
          config.rowBorderClass,
          className
        )
      )}
    >
      <span className="shrink-0 text-zinc-400 dark:text-zinc-500 select-none">
        [{formattedTime}]
      </span>

      <span
        className={clsx(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold tracking-wide uppercase select-none shrink-0",
          config.badgeClass
        )}
      >
        <IconComponent className="w-3 h-3 shrink-0" />
        {normalizedLevel}
      </span>

      {nodeId && (
        <span className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium border border-zinc-300/40 dark:border-zinc-700/50 select-none">
          node:{nodeId}
        </span>
      )}

      <span className="text-zinc-800 dark:text-zinc-200 break-all leading-relaxed flex-1">
        {message}
      </span>
    </div>
  );
}
