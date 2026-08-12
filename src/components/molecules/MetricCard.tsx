"use client";

import React from "react";
import { IconWrapper, IconWrapperVariant } from "@/components/atoms/IconWrapper";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  variant?: IconWrapperVariant;
  trend?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  variant = "neutral",
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center gap-3.5 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm select-none",
          className
        )
      )}
    >
      <IconWrapper variant={variant} size="lg">
        {icon}
      </IconWrapper>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {unit}
            </span>
          )}
        </div>
        {trend && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
