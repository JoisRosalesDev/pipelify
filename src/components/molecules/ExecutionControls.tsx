"use client";

import React from "react";
import { Play, Pause, Square, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/atoms/ActionButton";
import { ExecutionStatus } from "@/components/atoms/StatusBadge";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ExecutionControlsProps {
  status?: ExecutionStatus | string | null;
  onRun: () => void;
  onPause?: () => void;
  onCancel: () => void;
  onReset?: () => void;
  isDispatching?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ExecutionControls({
  status,
  onRun,
  onPause,
  onCancel,
  onReset,
  isDispatching = false,
  disabled = false,
  className,
}: ExecutionControlsProps) {
  const normalizedStatus = status?.toUpperCase() as ExecutionStatus | undefined;
  const isRunning = normalizedStatus === "RUNNING";
  const isPending = normalizedStatus === "PENDING";
  const isFinished =
    normalizedStatus === "COMPLETED" || normalizedStatus === "FAILED";

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm",
          className
        )
      )}
    >
      {!isRunning && !isPending && (
        <ActionButton
          variant="primary"
          size="md"
          icon={<Play className="w-4 h-4 fill-current" />}
          onClick={onRun}
          isLoading={isDispatching}
          loadingText="Iniciando..."
          disabled={disabled}
        >
          {isFinished ? "Re-ejecutar Pipeline" : "Ejecutar Pipeline"}
        </ActionButton>
      )}

      {(isRunning || isPending) && (
        <>
          {onPause && (
            <ActionButton
              variant="secondary"
              size="md"
              icon={<Pause className="w-4 h-4" />}
              onClick={onPause}
              disabled={disabled}
            >
              Pausar
            </ActionButton>
          )}

          <ActionButton
            variant="destructive"
            size="md"
            icon={<Square className="w-4 h-4 fill-current" />}
            onClick={onCancel}
            disabled={disabled}
          >
            Cancelar
          </ActionButton>
        </>
      )}

      {isFinished && onReset && (
        <ActionButton
          variant="outline"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={onReset}
          disabled={disabled}
        >
          Restablecer
        </ActionButton>
      )}
    </div>
  );
}
