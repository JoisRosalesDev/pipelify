"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface MetricLabelProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function MetricLabel({
  label,
  value,
  unit,
  className,
}: MetricLabelProps) {
  return (
    <div
      className={twMerge(
        clsx("inline-flex flex-col gap-0.5 select-none", className)
      )}
    >
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 flex items-baseline gap-1">
        {value}
        {unit && (
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
