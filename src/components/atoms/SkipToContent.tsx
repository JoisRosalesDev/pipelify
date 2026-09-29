"use client";

import React from "react";

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

/**
 * Accessible skip navigation link complying with WCAG 2.4.1 (Bypass Blocks).
 * Stays hidden off-screen (sr-only) until focused via keyboard navigation,
 * rendering with Pipelify's dark-mode design tokens.
 */
export function SkipToContent({
  targetId = "main-content",
  label = "Saltar al contenido principal",
  className = "",
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold shadow-lg border border-blue-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-all ${className}`}
    >
      {label}
    </a>
  );
}
