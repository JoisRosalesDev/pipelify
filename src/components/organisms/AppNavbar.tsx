"use client";

import React from "react";
import Link from "next/link";
import { Layers, BookOpen, GitFork } from "lucide-react";
import { BreadcrumbItem } from "@/components/molecules/Breadcrumbs";

export interface AppNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function AppNavbar({ className = "" }: AppNavbarProps) {
  return (
    <header
      className={`h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs animate-fade-in ${className}`}
    >
      {/* Lado Izquierdo: Brand Logo */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-bold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="tracking-tight font-extrabold text-base bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Pipelify
          </span>
        </Link>
      </div>

      {/* Lado Derecho: Enlaces de Navegación */}
      <nav className="flex items-center gap-2 shrink-0">
        <Link
          href="/pipelines"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <GitFork className="w-3.5 h-3.5 text-zinc-500" />
          <span>Pipelines</span>
        </Link>
        <Link
          href="/manual"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          <span>Manual</span>
        </Link>
      </nav>
    </header>
  );
}
