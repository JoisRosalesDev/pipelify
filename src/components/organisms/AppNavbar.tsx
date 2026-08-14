"use client";

import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/molecules/Breadcrumbs";

interface AppNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function AppNavbar({
  breadcrumbs = [],
  className = "",
}: AppNavbarProps) {
  return (
    <header
      className={`h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs ${className}`}
    >
      {/* Lado Izquierdo: Brand Logo + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/pipelines"
          className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-bold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="tracking-tight font-extrabold text-base bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Pipelify
          </span>
        </Link>

        {breadcrumbs.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">
              /
            </span>
            <div className="min-w-0">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
