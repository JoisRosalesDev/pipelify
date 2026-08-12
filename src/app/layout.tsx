import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReactFlowProvider } from "@/components/providers/ReactFlowProvider";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

const sansFont = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pipelify.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Pipelify — Orquestación y Monitoreo de Pipelines ETL en Tiempo Real",
    template: "%s | Pipelify DevTool",
  },
  description:
    "Plataforma DevTool SaaS distribuida para diseño de DAGs interactivos, orquestación de tareas ETL asíncronas con Celery y telemetría en tiempo real vía WebSockets y Redis Pub/Sub.",
  keywords: [
    "ETL",
    "Pipeline Orchestration",
    "DevTool SaaS",
    "Real-time Telemetry",
    "WebSockets",
    "FastAPI",
    "Next.js 14",
    "React Flow",
    "Celery",
    "Redis PubSub",
    "PostgreSQL",
  ],
  authors: [{ name: "Pipelify Engineering Team" }],
  creator: "Pipelify",
  publisher: "Pipelify Inc.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: baseUrl,
    title: "Pipelify — Orquestación y Monitoreo de Pipelines ETL en Tiempo Real",
    description:
      "Diseña DAGs de datos interactivos y monitorea ejecuciones asíncronas con telemetría WebSocket en vivo.",
    siteName: "Pipelify DevTool",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pipelify — Orquestación de Pipelines ETL en Tiempo Real",
    description:
      "Plataforma SaaS para orquestación de workflows de datos con FastAPI, Next.js y WebSockets.",
    creator: "@pipelify",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${sansFont.variable} ${monoFont.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-blue-500/20 selection:text-blue-400">
        <WebSocketProvider>
          <ReactFlowProvider>{children}</ReactFlowProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
