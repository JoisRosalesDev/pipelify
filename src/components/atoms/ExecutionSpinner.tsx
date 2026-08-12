"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ExecutionSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function ExecutionSpinner({
  size = "md",
  label,
  className,
}: ExecutionSpinnerProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400",
          className
        )
      )}
    >
      <Loader2
        className={clsx("animate-spin text-blue-500", sizeClasses[size])}
      />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
