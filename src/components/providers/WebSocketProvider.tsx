"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { WebSocketConnectionStatus } from "@/components/atoms/ConnectionIndicator";

export interface WSEventPayload {
  event: string;
  execution_id: string;
  node_id?: string;
  status?: string;
  metrics?: Record<string, unknown>;
  error_message?: string;
  timestamp: string;
  [key: string]: unknown;
}

interface WebSocketContextType {
  connectionStatus: WebSocketConnectionStatus;
  activeExecutionId: string | null;
  lastEvent: WSEventPayload | null;
  connect: (executionId: string, token?: string) => void;
  disconnect: () => void;
  sendMessage: (data: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("DISCONNECTED");
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(
    null
  );
  const [lastEvent, setLastEvent] = useState<WSEventPayload | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimers();
    if (socketRef.current) {
      socketRef.current.close(1000, "Clean disconnect");
      socketRef.current = null;
    }
    setConnectionStatus("DISCONNECTED");
    setActiveExecutionId(null);
    retryCountRef.current = 0;
  }, [clearTimers]);

  const connect = useCallback(
    (executionId: string, token?: string) => {
      disconnect();

      setActiveExecutionId(executionId);
      setConnectionStatus("CONNECTING");

      const wsBaseUrl =
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
      const wsUrl = `${wsBaseUrl}/ws/executions/${executionId}${tokenQuery}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus("LIVE");
          retryCountRef.current = 0;

          // Heartbeat Ping Ping every 20s
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  event: "PING",
                  timestamp: new Date().toISOString(),
                })
              );
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          try {
            const data: WSEventPayload = JSON.parse(event.data);
            if (data.event === "PING") {
              ws.send(
                JSON.stringify({
                  event: "PONG",
                  timestamp: new Date().toISOString(),
                })
              );
              return;
            }
            if (data.event === "PONG") {
              return;
            }
            setLastEvent(data);
          } catch {
            // Raw text fallback
          }
        };

        ws.onerror = () => {
          // Handled in onclose
        };

        ws.onclose = (event) => {
          clearTimers();
          if (event.code === 1000) {
            setConnectionStatus("DISCONNECTED");
            return;
          }

          // Exponential backoff reconnect logic
          if (retryCountRef.current < 5) {
            setConnectionStatus("RECONNECTING");
            const delay = Math.min(
              1000 * Math.pow(2, retryCountRef.current) +
                Math.random() * 1000,
              30000
            );
            retryCountRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(() => {
              connect(executionId, token);
            }, delay);
          } else {
            setConnectionStatus("DISCONNECTED");
          }
        };
      } catch {
        setConnectionStatus("DISCONNECTED");
      }
    },
    [clearTimers, disconnect]
  );

  const sendMessage = useCallback((data: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        typeof data === "string" ? data : JSON.stringify(data)
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        activeExecutionId,
        lastEvent,
        connect,
        disconnect,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext debe ser utilizado dentro de un WebSocketProvider"
    );
  }
  return context;
}
