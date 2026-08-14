# Especificación de Diseño y Sistema de Tokens UI: Orquestación de Pipelines ETL

**Cambio:** `realtime-pipeline-orchestration`  
**Plataforma:** Pipelify (SaaS DevTool)  
**Estado:** Especificación de Diseño UI Completa  

---

## 1. Configuración de Tailwind y Shadcn UI

### 1.1. Configuración Tailwind CSS (`tailwind.config.ts`)

La configuración define la paleta monocromática basada en `zinc`, los colores semánticos de estado para ejecuciones ETL (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`), la tipografía geométrica (`Inter`/`Geist`) y la escala de radios e hiper-animaciones requeridas para el lienzo de React Flow y consolas de monitoreo.

```typescript
import type { Config } from "tailwindcss";
import fontFamily from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", ...fontFamily.fontFamily.sans],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "Menlo", ...fontFamily.fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Colores semánticos de orquestación ETL
        status: {
          pending: {
            DEFAULT: "hsl(var(--status-pending))",
            foreground: "hsl(var(--status-pending-foreground))",
            border: "hsl(var(--status-pending-border))",
            bg: "hsl(var(--status-pending-bg))",
          },
          running: {
            DEFAULT: "hsl(var(--status-running))",
            foreground: "hsl(var(--status-running-foreground))",
            border: "hsl(var(--status-running-border))",
            bg: "hsl(var(--status-running-bg))",
          },
          completed: {
            DEFAULT: "hsl(var(--status-completed))",
            foreground: "hsl(var(--status-completed-foreground))",
            border: "hsl(var(--status-completed-border))",
            bg: "hsl(var(--status-completed-bg))",
          },
          failed: {
            DEFAULT: "hsl(var(--status-failed))",
            foreground: "hsl(var(--status-failed-foreground))",
            border: "hsl(var(--status-failed-border))",
            bg: "hsl(var(--status-failed-bg))",
          },
        },
        // Tokens específicos de consola de logs y WebSockets
        console: {
          bg: "hsl(var(--console-bg))",
          fg: "hsl(var(--console-fg))",
          border: "hsl(var(--console-border))",
          timestamp: "hsl(var(--console-timestamp))",
        },
        websocket: {
          live: "hsl(var(--ws-live))",
          reconnecting: "hsl(var(--ws-reconnecting))",
          disconnected: "hsl(var(--ws-disconnected))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.15)" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-20" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "dash-flow": "dash-flow 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

### 1.2. Estilos Globales y Variables CSS (`src/app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%;           /* zinc-50 */
    --foreground: 240 10% 3.9%;       /* zinc-950 */

    --card: 0 0% 100%;                /* white */
    --card-foreground: 240 10% 3.9%;  /* zinc-950 */

    --popover: 0 0% 100%;             /* white */
    --popover-foreground: 240 10% 3.9%;

    --primary: 240 5.9% 10%;          /* zinc-900 */
    --primary-foreground: 0 0% 98%;   /* zinc-50 */

    --secondary: 240 4.8% 95.9%;      /* zinc-100 */
    --secondary-foreground: 240 5.9% 10%;

    --muted: 240 4.8% 95.9%;          /* zinc-100 */
    --muted-foreground: 240 3.8% 46.1%;/* zinc-500 */

    --accent: 240 4.8% 95.9%;         /* zinc-100 */
    --accent-foreground: 240 5.9% 10%;

    --destructive: 0 84.2% 60.2%;     /* red-500 */
    --destructive-foreground: 0 0% 98%;

    --border: 240 5.9% 90%;           /* zinc-200 */
    --input: 240 5.9% 90%;            /* zinc-200 */
    --ring: 240 5.9% 10%;             /* zinc-900 */

    --radius: 0.5rem;                 /* 8px (rounded-md) */

    /* Tokens Semánticos de Estado ETL (Modo Claro) */
    --status-pending: 240 3.8% 46.1%;        /* zinc-500 */
    --status-pending-foreground: 240 5.9% 10%;
    --status-pending-border: 240 5.9% 85%;
    --status-pending-bg: 240 4.8% 96%;

    --status-running: 217.2 91.2% 59.8%;     /* blue-500 */
    --status-running-foreground: 217.2 91.2% 35%;
    --status-running-border: 217.2 91.2% 80%;
    --status-running-bg: 214 100% 97%;

    --status-completed: 142.1 76.2% 36.3%;   /* emerald-600 */
    --status-completed-foreground: 142.1 76.2% 20%;
    --status-completed-border: 142.1 76.2% 75%;
    --status-completed-bg: 143 85% 96%;

    --status-failed: 0 84.2% 60.2%;          /* red-600 */
    --status-failed-foreground: 0 84.2% 25%;
    --status-failed-border: 0 84.2% 80%;
    --status-failed-bg: 0 86% 97%;

    /* Consola de Logs (Modo Claro) */
    --console-bg: 240 5.9% 10%;              /* zinc-900 */
    --console-fg: 0 0% 98%;                  /* zinc-50 */
    --console-border: 240 3.7% 15.9%;
    --console-timestamp: 240 3.8% 46.1%;

    /* WebSocket Indicators */
    --ws-live: 142.1 76.2% 42%;              /* emerald-500 */
    --ws-reconnecting: 37.7 92.1% 50.2%;     /* amber-500 */
    --ws-disconnected: 0 84.2% 60.2%;        /* red-500 */
  }

  .dark {
    --background: 240 10% 3.9%;       /* zinc-950 */
    --foreground: 0 0% 98%;           /* zinc-50 */

    --card: 240 10% 3.9%;             /* zinc-950 */
    --card-foreground: 0 0% 98%;

    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;

    --primary: 0 0% 98%;              /* zinc-50 */
    --primary-foreground: 240 5.9% 10%;

    --secondary: 240 3.7% 15.9%;      /* zinc-800 */
    --secondary-foreground: 0 0% 98%;

    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%; /* zinc-400 */

    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 3.7% 15.9%;         /* zinc-800 */
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;

    /* Tokens Semánticos de Estado ETL (Modo Oscuro) */
    --status-pending: 240 5% 64.9%;
    --status-pending-foreground: 0 0% 98%;
    --status-pending-border: 240 3.7% 25%;
    --status-pending-bg: 240 3.7% 12%;

    --status-running: 217.2 91.2% 59.8%;
    --status-running-foreground: 214 100% 95%;
    --status-running-border: 217.2 91.2% 40%;
    --status-running-bg: 217.2 91.2% 12%;

    --status-completed: 142.1 70.6% 45.3%;
    --status-completed-foreground: 143 85% 95%;
    --status-completed-border: 142.1 70.6% 30%;
    --status-completed-bg: 142.1 70.6% 10%;

    --status-failed: 0 72.2% 50.6%;
    --status-failed-foreground: 0 86% 95%;
    --status-failed-border: 0 72.2% 35%;
    --status-failed-bg: 0 72.2% 12%;

    /* Consola de Logs (Modo Oscuro) */
    --console-bg: 240 10% 2%;
    --console-fg: 0 0% 95%;
    --console-border: 240 3.7% 15.9%;
    --console-timestamp: 240 5% 55%;

    /* WebSocket Indicators */
    --ws-live: 142.1 70.6% 45.3%;
    --ws-reconnecting: 37.7 92.1% 50.2%;
    --ws-disconnected: 0 72.2% 50.6%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased selection:bg-zinc-800 selection:text-zinc-50;
  }
}

/* Personalización de Canvas React Flow */
.react-flow__node {
  @apply rounded-md transition-all duration-200;
}

.react-flow__edge-path {
  stroke-width: 2;
  transition: stroke 0.3s ease, stroke-width 0.2s ease;
}

.react-flow__edge.animated .react-flow__edge-path {
  stroke-dasharray: 5;
  animation: dash-flow 1s linear infinite;
}

.react-flow__handle {
  @apply w-3 h-3 bg-white border-2 border-zinc-400 rounded-full transition-transform hover:scale-125;
}

/* Scrollbars personalizadas para consola de logs */
.console-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.console-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.console-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-zinc-700/50 rounded-full hover:bg-zinc-600;
}
```

---

## 2. Diccionario de Tokens de UI (Átomos)

El siguiente diccionario define de forma exhaustiva la mapeación exacta de componentes de UI a combinaciones utilitarias de Tailwind CSS, clases semánticas, estados interactivos y comportamiento móvil accesibilidad.

| Átomo / Componente | Subtipo / Estado | Clases Tailwind CSS Exactas | Tokens de Color / Medidas | Comportamiento & Accesibilidad |
| :--- | :--- | :--- | :--- | :--- |
| **React Flow Custom Node** | `Container Base` | `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm p-3 min-w-[220px] max-w-[280px] select-none transition-all duration-200` | `radius: 8px`, `border: 1px`, `shadow: shadow-sm` | Arrastrable en canvas, soporta foco vía teclado y toque táctil optimizado sin hover |
| **React Flow Custom Node** | `State: PENDING` | `border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-90` | `border-status-pending`, `bg-zinc-50` | Opacidad reducida indicando en espera de ejecución |
| **React Flow Custom Node** | `State: RUNNING` | `border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-md` | `border-blue-500`, `ring: 2px` | Anillo azul resplandeciente activo durante el procesamiento del nodo ETL |
| **React Flow Custom Node** | `State: COMPLETED` | `border-emerald-500 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm` | `border-emerald-500`, `bg-emerald-50` | Borde verde esmeralda confirmando finalización exitosa |
| **React Flow Custom Node** | `State: FAILED` | `border-red-500 dark:border-red-400 bg-red-50/40 dark:bg-red-950/30 ring-2 ring-red-500/20 shadow-sm` | `border-red-500`, `bg-red-50` | Alerta roja destacada con icono de advertencia |
| **React Flow Custom Node** | `State: SELECTED` | `ring-2 ring-zinc-900 dark:ring-zinc-100 border-transparent shadow-md` | `ring: 2px zinc-900` | Resaltado cuando el usuario hace clic o toque táctil sobre el nodo |
| **Status Badge** | `PENDING` | `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700` | `font-size: 12px`, `height: 22px` | Icono `Clock` (12px), texto estático neutro |
| **Status Badge** | `RUNNING` | `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800` | `font-size: 12px`, `bg-blue-50` | Icono `Loader2` girando continuamente (`animate-spin`) |
| **Status Badge** | `COMPLETED` | `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800` | `font-size: 12px`, `bg-emerald-50` | Icono `CheckCircle2` (12px) de confirmación |
| **Status Badge** | `FAILED` | `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800` | `font-size: 12px`, `bg-red-50` | Icono `XCircle` o `AlertTriangle` (12px) |
| **Connection Badge** | `WS Connected (LIVE)` | `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm border border-zinc-800 dark:border-zinc-200` | `font-mono`, `text-xs` | Incluye punto verde interior: `h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow` |
| **Connection Badge** | `WS Reconnecting` | `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800` | `font-mono`, `text-xs` | Incluye punto ámbar interior con rotación de incono `RefreshCw` (`animate-spin`) |
| **Connection Badge** | `WS Disconnected` | `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-100 text-zinc-500 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700` | `font-mono`, `text-xs` | Punto gris neutro `h-2 w-2 rounded-full bg-zinc-400` |
| **Log Console** | `Container Base` | `w-full bg-zinc-950 text-zinc-100 font-mono text-xs rounded-lg border border-zinc-800 shadow-lg overflow-hidden flex flex-col` | `bg-zinc-950`, `font-mono` | Mantiene scroll automático al final cuando ingresan nuevos eventos WS |
| **Log Console** | `Header Bar` | `flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none` | `bg-zinc-900`, `border-b` | Contiene título "Consola de Ejecución", badges de total de registros y botón de limpiar |
| **Log Console** | `Row: INFO` | `flex items-start gap-3 px-4 py-1.5 hover:bg-zinc-900/60 border-b border-zinc-900/40 text-zinc-300 transition-colors` | `text-zinc-300` | Marca de tiempo en `text-zinc-500 font-mono select-none` |
| **Log Console** | `Row: WARN` | `flex items-start gap-3 px-4 py-1.5 bg-amber-950/20 hover:bg-amber-950/30 border-b border-zinc-900/40 text-amber-300 transition-colors` | `text-amber-300` | Tag `[WARN]` destacado en amarillo ámbar |
| **Log Console** | `Row: ERROR` | `flex items-start gap-3 px-4 py-1.5 bg-red-950/30 hover:bg-red-950/40 border-b border-red-900/20 text-red-400 transition-colors` | `text-red-400` | Tag `[ERROR]` destacado en rojo |
| **Log Console** | `Row: SUCCESS` | `flex items-start gap-3 px-4 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/30 border-b border-zinc-900/40 text-emerald-400 transition-colors` | `text-emerald-400` | Tag `[SUCCESS]` destacado en verde esmeralda |
| **Primary Button** | `Default (Ejecutar)` | `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:opacity-50 disabled:pointer-events-none touch-manipulation min-h-[40px]` | `height: 40px (touch-friendly)` | Optimizado para toques en dispositivos móviles (`min-h-[40px]`) |
| **Primary Button** | `Loading` | `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm bg-zinc-800 text-zinc-300 cursor-not-allowed opacity-80 min-h-[40px]` | `opacity-80` | Muestra spinner `Loader2` animado y deshabilita interacción |
| **Secondary Button** | `Default (Cancelar)` | `inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 touch-manipulation min-h-[40px]` | `border: 1px zinc-200` | Acción secundaria o de abortado manual |
| **Skeleton Loader** | `Node Card` | `w-[240px] h-[100px] rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse p-3 flex flex-col justify-between border border-zinc-200/50` | `animate-pulse` | Reemplazo visual mientras se carga la estructura del DAG por REST |
| **Skeleton Loader** | `Metric Box` | `w-full h-[72px] rounded-md bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse` | `animate-pulse` | Marcador de posición para métricas de tiempo y rendimiento ETL |

---

## 3. Estructura de Layout (Plantillas)

### 3.1. Disposición Desktop (Rejilla y Paneles)

En pantallas de escritorio (`>= 1024px`), la aplicación se organiza mediante una rejilla fluida de 12 columnas con áreas dedicadas para paleta de nodos, canvas principal de React Flow, panel lateral de inspección de propiedades y consola inferior colapsable.

```
+-------------------------------------------------------------------------------------------------------------------+
| PIPELIFY ETL ORCHESTRATOR                                          [ WebSocket: LIVE (●) ]  [ Run Execution ▶ ]  |  Header (h-14)
+-------------------+-------------------------------------------------------------------+---------------------------+
| PALETA DE NODOS   | CANVAS DE REACT FLOW (DAG INTERACTIVO)                            | PANEL DE CONFIGURACIÓN    |
| (w-64)            | (col-span-full / flex-1)                                          | Y METRICAS (w-80 / w-96)  |
|                   |                                                                   |                           |
| [ Extraer DB ]    |       +-------------------+       +-------------------+           | Nodo Seleccionado:        |
| [ Transf. SQL ]   |       | Node 1: Extractor |------>| Node 2: Transform |           | "Node 1: Extractor"       |
| [ Cargar S3 ]     |       | Status: COMPLETED |       | Status: RUNNING ↺ |           |                           |
| [ Filtro JSON ]   |       +-------------------+       +-------------------+           | Parámetros:               |
|                   |                                         |                         | - Host: db.prod.internal  |
|                   |                                         v                         | - Tabla: sales_orders     |
|                   |                               +-------------------+               | - Registros: 15,420       |
|                   |                               | Node 3: Loader S3 |               |                           |
|                   |                               | Status: PENDING   |               | Metricas en Tiempo Real:  |
|                   |                               +-------------------+               | - Latencia: 45ms          |
+-------------------+-------------------------------------------------------------------+---------------------------+
| CONSOLA DE LOGS Y EVENTOS WEBSOCKET (Colapsable / h-48 o h-64)                                                     |
| [15:10:02 Z] [INFO] Inicio de ejecución ID: 3a7b9c20-8d5f-4a1e-b2c3-d4e5f6a7b8c9                                  |
| [15:10:05 Z] [INFO] Node 1 (Extractor) procesó 15,420 registros en 320ms.                                        |
| [15:10:06 Z] [WARN] Node 2 (Transform) reintento 1/3 aplicado por latencia de red.                               |
+-------------------------------------------------------------------------------------------------------------------+
```

#### Especificación de Clases de Rejilla Desktop:
* **Contenedor Principal Layout:** `flex flex-col h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950`
* **Barra Superior Header:** `h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between shrink-0`
* **Cuerpo Principal Layout:** `flex flex-1 overflow-hidden relative`
* **Paleta de Nodos Izquierda:** `w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3 shrink-0 select-none hidden lg:flex`
* **Área Canvas React Flow:** `flex-1 relative h-full bg-zinc-50 dark:bg-zinc-950`
* **Panel Inspección Izquierda/Derecha:** `w-80 xl:w-96 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto hidden md:flex`
* **Consola Inferior Colapsable:** `h-56 border-t border-zinc-800 bg-zinc-950 text-zinc-100 flex flex-col shrink-0 transition-all duration-300`

---

### 3.2. Disposición Mobile First (Bottom Sheets & Touches Accesibles)

En dispositivos móviles (`< 768px`), el lienzo de React Flow ocupa el 100% de la pantalla para maximizar la superficie táctil. Las propiedades del nodo seleccionado y los controles de ejecución se despliegan mediante un **Bottom Sheet deslizable táctil**, eliminando dependencias de acciones flotantes o eventos *hover*.

```
+-----------------------------------------------+
| PIPELIFY  [ WS: LIVE ● ]  [ Toggle Logs 📋 ]  |  Mobile Header (h-12)
+-----------------------------------------------+
| CANVAS DE REACT FLOW (100% VP HEIGHT & WIDTH) |
|                                               |
|       +-------------------+                   |
|       | Node 1: Extractor |                   |
|       | Status: COMPLETED |                   |
|       +-------------------+                   |
|                 |                             |
|                 v                             |
|       +-------------------+                   |
|       | Node 2: Transform |                   |
|       | Status: RUNNING ↺ |                   |
|       +-------------------+                   |
|                                               |
|                                               |
| [ FAB: EJECUTAR PIPELINE ▶ ]                  |  Floating Action Bar (Bottom Right)
+-----------------------------------------------+
| BOTTOM SHEET / DRAWER TÁCTIL (Deslizable ↑)   |  Mobile Sheet (Overlay / Slide-up)
| ============================================= |  Handle de arrastre táctil (w-12 h-1.5)
| NODO: Node 2: Transform (RUNNING ↺)          |
| Registros Procesados: 1,500 / 5,000           |
| [ Ver Logs Completos ]  [ Cancelar Nodo ]     |
+-----------------------------------------------+
```

#### Especificaciones y Accesibilidad Mobile First:
1. **Controles Táctiles Integrados (*Touch-friendly Canvas Controls*):**
   * Botones de Pan/Zoom en el canvas con tamaño mínimo de toque de `44x44px` (`min-w-[44px] min-h-[44px]`).
   * Desactivación de comportamientos de arrastre accidentales mediante *touch-action: manipulation*.
2. **Bottom Sheet de Configuración & Métricas (*Drawer Táctil*):**
   * Clases Tailwind: `fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-xl shadow-2xl p-4 transition-transform duration-300 max-h-[80vh] overflow-y-auto`
   * Indicador táctil superior (*Drag Handle*): `w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 cursor-grab active:cursor-grabbing`
3. **Barra Flotante de Acciones Rápida (*Floating Action Bar - FAB*):**
   * Clases Tailwind: `fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-5 py-3 rounded-full shadow-xl font-medium text-sm active:scale-95 transition-transform md:hidden`
4. **Modo Alternativo de Consola Fullscreen en Móvil:**
   * Al accionar el botón `[ Toggle Logs 📋 ]` en la barra superior móvil, la consola se expande a pantalla completa (`fixed inset-0 z-50 bg-zinc-950 p-3 flex flex-col`) permitiendo inspeccionar eventos de socket sin obstrucción visual del grafo.
