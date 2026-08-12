"use client";

import React from "react";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ExecutionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

interface StatusBadgeProps {
  status: ExecutionStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  ExecutionStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
    iconClass: string;
    dotClass: string;
  }
> = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    containerClass:
      "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/20",
    iconClass: "text-zinc-500 dark:text-zinc-400",
    dotClass: "bg-zinc-400",
  },
  RUNNING: {
    label: "En Ejecución",
    icon: Loader2,
    containerClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20 animate-pulse-glow",
    iconClass: "text-blue-500 dark:text-blue-400 animate-spin",
    dotClass: "bg-blue-500 animate-ping",
  },
  COMPLETED: {
    label: "Completado",
    icon: CheckCircle2,
    containerClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20",
    iconClass: "text-emerald-500 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  FAILED: {
    label: "Fallido",
    icon: XCircle,
    containerClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20",
    iconClass: "text-rose-500 dark:text-rose-400",
    dotClass: "bg-rose-500",
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1 border",
  md: "text-sm px-2.5 py-1 gap-1.5 border",
  lg: "text-base px-3 py-1.5 gap-2 border-2",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  label,
  className,
}: StatusBadgeProps) {
  const normalizedStatus = (
    typeof status === "string" ? status.toUpperCase() : "PENDING"
  ) as ExecutionStatus;

  const config = statusConfig[normalizedStatus] || statusConfig.PENDING;
  const IconComponent = config.icon;

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium rounded-full transition-colors select-none",
          config.containerClass,
          sizeClasses[size],
          className
        )
      )}
    >
      {showIcon && (
        <IconComponent
          className={clsx("shrink-0", config.iconClass, iconSizes[size])}
        />
      )}
      <span>{label || config.label}</span>
    </span>
  );
}
