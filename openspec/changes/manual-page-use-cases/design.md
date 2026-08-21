# Design: Manual Page with 3 Structured Use Cases

## Technical Approach

Implement an interactive `/manual` route adhering strictly to Pipelify's art direction and Atomic Design system (Zinc neutral palette, Tailwind CSS 4 tokens, Lucide icons, responsive flex/grid layouts). The page presents 3 real-world ETL use cases (Sales Sync, ML User Segmentation, and Inventory Reconciliation) with an interactive stepper guiding developers through extraction, transformation, loading, and live telemetry verification. Update `src/app/page.tsx` hero CTA from "Explorar Ejecución" to "Manual" linking directly to `/manual`.

## Architecture Decisions

### Decision: Dedicated Manual Route Structure

| Option | Tradeoff | Decision |
|---|---|---|
| Static Modal / Popover | Limited screen space, not shareable via URL | Rejected |
| Dedicated `/manual` Page | Full responsive layout, direct deep-linking, SEO & bookmarkable | **Chosen** |

**Rationale**: A standalone page allows detailed visual explanations, code/config snippets, and direct interactive execution triggers without cluttering existing modal states.

### Decision: Art Direction & Component Reuse

| Option | Tradeoff | Decision |
|---|---|---|
| New standalone CSS styles | Introduces design divergence and maintenance overhead | Rejected |
| Atomic Design Tokens (`ActionButton`, `MetricCard`, `StatusBadge`, `AppNavbar`) | Complete visual cohesion with dashboard and canvas | **Chosen** |

**Rationale**: Reusing `AppNavbar`, `MetricCard`, `ActionButton`, and zinc-900/50 typography keeps the UI strictly aligned with the rest of the application.

## Data Flow

```
Landing Page (/)
      │
      ▼ [Click "Manual" CTA]
Manual Page (/manual)
      │
      ├─► Select Use Case (PostgreSQL -> BigQuery | Redis -> S3 | ERP -> Redis)
      │
      ├─► Step 1: Extractor Configuration (Source, Queries, Batching)
      ├─► Step 2: Transformation Logic (JSON Mapping, Encoders, Deltas)
      ├─► Step 3: Loader Target (Data Warehouse, Data Lake, Cache)
      └─► Step 4: Live Telemetry & Verification (WebSocket streaming, Logs)
      │
      ▼ [Click "Abrir en Canvas" / "Ejecutar Pipeline"]
Pipeline Canvas / Execution Telemetry (/executions/[pipelineId])
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/manual.ts` | Create | TypeScript interfaces for use cases, execution steps, and architecture badges |
| `src/app/manual/page.tsx` | Create | Interactive Manual page with 3 use cases, step-by-step walkthrough, and DAG triggers |
| `src/app/page.tsx` | Modify | Update landing hero CTA button to "Manual" linking to `/manual` with `BookOpen` icon |

## Interfaces / Contracts

```typescript
export interface ManualStep {
  stepNumber: number;
  title: string;
  stage: "extractor" | "transformer" | "loader" | "telemetry";
  description: string;
  codeSnippet?: string;
  configSummary?: Record<string, string | number>;
  tips?: string;
}

export interface ManualUseCase {
  id: string;
  pipelineId: string;
  title: string;
  category: string;
  badgeVariant: "info" | "warning" | "success";
  description: string;
  architectureSummary: string[];
  metricsPreview: { label: string; value: string }[];
  steps: ManualStep[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit / UI | Navigation button renders with "Manual" and href `/manual` | Component test / lint check |
| Integration | `/manual` displays 3 use-case cards and switches active tabs properly | Next.js route build and interactive state test |
| Manual / E2E | Dark/Light theme switching and mobile viewport responsiveness | Browser verification |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No database or backend migration required. The change is purely frontend UI and navigation routing.

## Open Questions

- None.
