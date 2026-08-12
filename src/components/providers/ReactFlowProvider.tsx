"use client";

import React from "react";
import { ReactFlowProvider as BaseReactFlowProvider } from "@xyflow/react";

export function ReactFlowProvider({ children }: { children: React.ReactNode }) {
  return <BaseReactFlowProvider>{children}</BaseReactFlowProvider>;
}
