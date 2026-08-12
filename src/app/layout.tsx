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

export const metadata: Metadata = {
  title: "Pipelify - Orquestación de Pipelines ETL en Tiempo Real",
  description:
    "Plataforma DevTool SaaS para diseño, ejecución y monitoreo reactivo de pipelines ETL en tiempo real con WebSockets y Celery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
