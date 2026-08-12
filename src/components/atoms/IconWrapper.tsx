"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type IconWrapperVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "info";

interface IconWrapperProps {
  children: React.ReactNode;
  variant?: IconWrapperVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantClasses: Record<IconWrapperVariant, string> = {
  primary: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  error: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const sizeClasses = {
  sm: "w-7 h-7 rounded-md p-1.5",
  md: "w-9 h-9 rounded-lg p-2",
  lg: "w-12 h-12 rounded-xl p-3",
};

export function IconWrapper({
  children,
  variant = "neutral",
  size = "md",
  className,
}: IconWrapperProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center shrink-0 transition-colors",
          variantClasses[variant],
          sizeClasses[size],
          className
        )
      )}
    >
      {children}
    </div>
  );
}
