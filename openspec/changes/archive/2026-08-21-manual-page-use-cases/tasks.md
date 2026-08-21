# Tasks: Manual Page with 3 Structured Use Cases

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250-320 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types, Manual Page & Landing CTA | PR 1 | `bun next lint` | Next.js dev server on `/manual` | Revert `src/app/manual/` and `src/app/page.tsx` |

## Phase 1: Foundation & Types

- [x] 1.1 Create `src/types/manual.ts` defining `ManualStep`, `ManualUseCase`, `ManualArchitectureNode` interfaces and datasets.
- [x] 1.2 Populate use-case data array with the 3 structured ETL workflows (Sales Sync, ML Feature Vectorization, Inventory Cleanup) and their step-by-step metadata.

## Phase 2: Manual Page Implementation

- [x] 2.1 Create `src/app/manual/page.tsx` incorporating `AppNavbar`, breadcrumbs, hero header, and use-case selection tabs.
- [x] 2.2 Implement interactive step-by-step card workflow (Extractor, Transformer, Loader, Telemetry) with config highlights and code snippets.
- [x] 2.3 Add quick-action execution CTAs on each use-case card linking to `/executions/{pipelineId}`.
- [x] 2.4 Apply responsive grid layouts and Dark/Light zinc theme styling compliant with Pipelify art direction.

## Phase 3: Landing Page CTA Update

- [x] 3.1 Modify `src/app/page.tsx` hero section to replace the "Explorar Ejecución" button with "Manual", linking to `/manual` with the `BookOpen` icon.

## Phase 4: Verification & Polish

- [x] 4.1 Execute build and lint check (`bun next build` or `bun next lint`) to confirm TypeScript type safety and zero regressions.
- [x] 4.2 Verify navigation flows between Landing (`/`), Manual (`/manual`), and Execution Canvas (`/executions/[id]`).
