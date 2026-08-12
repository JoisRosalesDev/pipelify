"use client";

import React from "react";
import { Radio, RefreshCw, WifiOff, Activity } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type WebSocketConnectionStatus =
  | "LIVE"
  | "CONNECTING"
  | "RECONNECTING"
  | "DISCONNECTED";

interface ConnectionIndicatorProps {
  status: WebSocketConnectionStatus;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<
  WebSocketConnectionStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    dotClass: string;
    pulseClass?: string;
  }
> = {
  LIVE: {
    label: "WS Conectado (EN VIVO)",
    icon: Radio,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    pulseClass: "bg-emerald-400 animate-ping",
  },
  CONNECTING: {
    label: "Conectando WS...",
    icon: RefreshCw,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-500",
    pulseClass: undefined,
  },
  RECONNECTING: {
    label: "WS Reconectando...",
    icon: RefreshCw,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-500",
    pulseClass: undefined,
  },
  DISCONNECTED: {
    label: "WS Desconectado",
    icon: WifiOff,
    badgeClass:
      "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
    dotClass: "bg-zinc-400 dark:bg-zinc-600",
    pulseClass: undefined,
  },
};

export function ConnectionIndicator({
  status,
  compact = false,
  className,
}: ConnectionIndicatorProps) {
  const config = statusConfig[status] || statusConfig.DISCONNECTED;
  const isSpinning = status === "CONNECTING" || status === "RECONNECTING";

  if (compact) {
    return (
      <div
        className={twMerge(
          clsx("relative flex items-center justify-center p-1", className)
        )}
        title={config.label}
      >
        <span className="relative flex h-2.5 w-2.5">
          {config.pulseClass && (
            <span
              className={clsx(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                config.pulseClass
              )}
            />
          )}
          <span
            className={clsx(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              config.dotClass
            )}
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium select-none transition-colors",
          config.badgeClass,
          className
        )
      )}
    >
      <div className="relative flex items-center justify-center">
        <span className="relative flex h-2 w-2">
          {config.pulseClass && (
            <span
              className={clsx(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                config.pulseClass
              )}
            />
          )}
          <span
            className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              config.dotClass
            )}
          />
        </span>
      </div>
      {isSpinning ? (
        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
      ) : (
        <Activity className="w-3 h-3 shrink-0 opacity-80" />
      )}
      <span>{config.label}</span>
    </div>
  );
}
