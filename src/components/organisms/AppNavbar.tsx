"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  Activity,
  Plus,
  Compass,
  CheckCircle,
} from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/molecules/Breadcrumbs";
import { ActionButton } from "@/components/atoms/ActionButton";

interface AppNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backFallbackHref?: string;
  className?: string;
}

export function AppNavbar({
  breadcrumbs = [],
  showBackButton = false,
  backFallbackHref = "/pipelines",
  className = "",
}: AppNavbarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(backFallbackHref);
    }
  };

  return (
    <header
      className={`h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs ${className}`}
    >
      {/* Lado Izquierdo: Brand + Backbutton + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
            title="Volver a la página anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atrás</span>
          </button>
        )}

        <Link
          href="/pipelines"
          className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-bold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline tracking-tight font-extrabold text-base bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Pipelify
          </span>
        </Link>

        {breadcrumbs.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">
              |
            </span>
            <div className="min-w-0">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </>
        )}
      </div>

      {/* Lado Derecho: Navegación Rápida & Acciones */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/pipelines"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden md:flex items-center gap-1.5"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Pipelines</span>
        </Link>

        <Link href="/executions/new">
          <ActionButton
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Nuevo Pipeline</span>
            <span className="sm:hidden">Nuevo</span>
          </ActionButton>
        </Link>
      </div>
    </header>
  );
}
