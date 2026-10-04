"use client";

import React, { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Node,
  Edge,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CustomETLNode } from "@/components/organisms/CustomETLNode";
import { ETLNodeData, ETLNodeType } from "@/types/pipeline";
import { Layers } from "lucide-react";

const nodeTypes: NodeTypes = {
  customETLNode: CustomETLNode as NodeTypes[string],
};

interface PipelineCanvasProps {
  nodes: Node<ETLNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<ETLNodeData>>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (type: ETLNodeType, position: { x: number; y: number }) => void;
  className?: string;
}

function PipelineCanvasContent({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onAddNode,
  className,
}: PipelineCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const prevNodesCountRef = useRef(nodes.length);
  const isInitialMount = useRef(true);

  // Smoothly center and focus on newly added nodes (e.g. added via tap/palette)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevNodesCountRef.current = nodes.length;
      return;
    }

    if (nodes.length > prevNodesCountRef.current) {
      const latestNode = nodes[nodes.length - 1];
      if (latestNode && latestNode.position) {
        setCenter(latestNode.position.x + 120, latestNode.position.y + 60, {
          duration: 500,
        });
      }
    }
    prevNodesCountRef.current = nodes.length;
  }, [nodes, setCenter]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as ETLNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAddNode(type, position);
    },
    [screenToFlowPosition, onAddNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const onPaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div
      ref={reactFlowWrapper}
      className={`relative w-full h-full bg-zinc-50 dark:bg-zinc-950 ${className || ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        panOnDrag={true}
        zoomOnPinch={true}
        preventScrolling={true}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "hsl(var(--border))" },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#a1a1aa" />
        <Controls className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !shadow-sm !rounded-lg touch-manipulation" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !rounded-lg hidden sm:block"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none text-zinc-400">
          <Layers className="w-10 h-10 stroke-1" />
          <p className="text-sm font-medium">El lienzo está vacío.</p>
          <p className="text-xs">Arrastra componentes o agrégalos con el botón de la paleta.</p>
        </div>
      )}
    </div>
  );
}

export function PipelineCanvas(props: PipelineCanvasProps) {
  return <PipelineCanvasContent {...props} />;
}
