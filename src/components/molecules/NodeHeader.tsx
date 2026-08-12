"use client";

import React from "react";
import { StatusBadge, ExecutionStatus } from "@/components/atoms/StatusBadge";
import { IconWrapper } from "@/components/atoms/IconWrapper";
import { Cpu } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface NodeHeaderProps {
  title: string;
  nodeType: string;
  status?: ExecutionStatus | string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function NodeHeader({
  title,
  nodeType,
  status,
  icon,
  subtitle,
  className,
}: NodeHeaderProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl",
          className
        )
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <IconWrapper variant="primary" size="md">
          {icon || <Cpu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
        </IconWrapper>
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </h3>
            <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              {nodeType}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {status && (
        <StatusBadge
          status={status}
          size="sm"
          className="shrink-0"
        />
      )}
    </div>
  );
}
