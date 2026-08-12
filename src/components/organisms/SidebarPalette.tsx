"use client";

import React from "react";
import { Database, Cpu, UploadCloud, Plus, GripVertical } from "lucide-react";
import { ETLNodeType } from "@/types/pipeline";
import { clsx } from "clsx";

interface NodePaletteItem {
  type: ETLNodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const PALETTE_ITEMS: NodePaletteItem[] = [
  {
    type: "extractor",
    label: "Extractor",
    description: "Conecta y extrae datos desde bases de datos o fuentes externas.",
    icon: Database,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-200 dark:border-blue-800",
  },
  {
    type: "transformer",
    label: "Transformador",
    description: "Aplica reglas de negocio, filtros y mapeo de campos JSON.",
    icon: Cpu,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-200 dark:border-purple-800",
  },
  {
    type: "loader",
    label: "Cargador",
    description: "Inserta o transmite datos procesados a su destino final.",
    icon: UploadCloud,
    colorClass: "text-emerald-500 bg-emerald-50/10 border-emerald-200 dark:border-emerald-800",
  },
];

interface SidebarPaletteProps {
  onAddNode?: (type: ETLNodeType) => void;
  className?: string;
}

export function SidebarPalette({ onAddNode, className }: SidebarPaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: ETLNodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className={clsx(
        "w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-4 shrink-0 select-none",
        className
      )}
    >
      <div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Paleta de Nodos ETL
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Arrastra o agrega componentes al lienzo para diseñar tu pipeline.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className="group relative flex flex-col p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "flex items-center justify-center w-7 h-7 rounded-lg border",
                      item.colorClass
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {onAddNode && (
                    <button
                      type="button"
                      onClick={() => onAddNode(item.type)}
                      title="Agregar al lienzo"
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <GripVertical className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
