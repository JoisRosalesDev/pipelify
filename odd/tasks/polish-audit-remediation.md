# Feature: Polish Audit Remediation — Pipelify Frontend

## Objective
Remediate all P0 (blocking), P1 (major), P2 (minor), and P3 (polish) issues identified in the Impeccable dual-agent comprehensive design critique and technical audit of the Pipelify platform.

## Problem Statement
The comprehensive audit of Pipelify revealed several architectural, UX, and technical defects:
1. **DAG Handle Inversion**: Handles in `CustomETLNode` were vertical (`Top`/`Bottom`) despite the pipeline flowing horizontally (`Left -> Right`), resulting in awkward backward looping connectors.
2. **Mobile Interaction Lockout**: The node palette was hidden on viewports `< md`, HTML5 Drag & Drop failed on touch devices, and `MobileBottomSheet` lacked editing capabilities.
3. **Missing Error Boundaries**: No `error.tsx` existed, risking full-app white screens on unhandled WebSocket payloads or graph rendering errors.
4. **Invalid DOM Nesting & A11y**: `<Link>` wrapping `<ActionButton>` produced illegal `<a><button>` DOM structures, and contrast ratios in log timestamps fell below WCAG AA 4.5:1.
5. **Telemetry Performance Bottlenecks**: Synchronous auto-scroll triggered layout thrashing, unmemoized log rows caused cascading re-renders, and the logs array grew unbounded in memory.
6. **Orphaned Elements & Design Slop**: `Breadcrumbs` were computed but never rendered in `AppNavbar`, duplicate connection indicators appeared in the header, and decorative gradient texts persisted.

## Why
Transform Pipelify from a prototype with AI design tells into a robust, high-performance, accessible, and responsive developer tool for data engineers, fully compliant with WCAG 2.1/2.2 AA, EAA 2025, and Ley 20.422.

## Scope & Constraints
- **Scope**: `src/components/`, `src/app/`, `src/hooks/`, `src/app/globals.css`.
- **Constraints**: Preserved Next.js 14 App Router, React Flow 12, WebSocket real-time contracts, and TypeScript strict safety without breaking existing routes or backend contracts.

## Actionable Task Checklist

- [x] **TASK-01: Fix DAG Connection Handles & CustomETLNode UX (P0)**
  - Route: delegated direct (`11fa5867-5706-4c78-ad72-d1ff67d865f2`)
  - Commit: `0589d70`
  - Details: Reoriented target handle to `Position.Left` and source handle to `Position.Right`. Replaced expensive continuous `boxShadow` in `tailwind.config.ts` with GPU-friendly opacity glow. Added expandable error traceback toggle ("Ver detalle" / "Ocultar") and accessible ARIA attributes (`role="region"`, `tabIndex={0}`, focus rings).
  - Verification: `npx tsc --noEmit` clean, `npm run lint` clean.

- [x] **TASK-02: Enable Mobile & Touch Parity on Pipeline Canvas (P0)**
  - Route: delegated direct (`e72035b3-8e2f-4a9d-9c8f-1507b14b22b4`)
  - Commit: `58a9af9`
  - Details: Added mobile "+ Nodo" button in toolbar header to open a mobile palette drawer. Added tap-to-add with staggered node coordinates. Upgraded `MobileBottomSheet` to allow configuring parameters (`batchSize`, `timeoutSec`, `writeMode`, `tableName`, `transformFunction`). Ensured touch targets >= 44x44px and added `Escape` key/backdrop dismiss.
  - Verification: `npx tsc --noEmit` clean, `npm run lint` clean.

- [x] **TASK-03: Implement Global & Route Error Boundaries (P0)**
  - Route: direct inline
  - Commit: `0b79f64`
  - Details: Created `src/app/error.tsx` (global boundary) and `src/app/(dashboard)/executions/[executionId]/error.tsx` (route boundary) with reset actions, error reporting, and accessible navigation.
  - Verification: `npx tsc --noEmit` clean.

- [x] **TASK-04: Eliminate Nested Interactive Elements & Upgrade ActionButton (P1)**
  - Route: delegated direct (`2e0ccbb6-2d9a-4bb2-9a36-29960931ca9d`)
  - Commit: `bbb499d`
  - Details: Added polymorphic `href` support to `ActionButton` so it renders a Next.js `Link` when `href` is supplied, eliminating `<a><button>` nesting across `page.tsx`, `pipelines/page.tsx`, and `manual/page.tsx`. Ensured all button sizes meet >= 44x44px touch targets and added `aria-busy="true"`.
  - Verification: `git grep -E "(<Link[^>]*>\s*<ActionButton|<a[^>]*>\s*<button)" src/` returned 0 matches.

- [x] **TASK-05: Optimize Telemetry Stream & Fix Memory Leaks (P1)**
  - Route: delegated direct (`a1dec68a-63e0-4415-872b-2faf5cc2dfdc`)
  - Commit: `ea29028`
  - Details: Memoized `LogViewerRow` with `React.memo`. Throttled auto-scroll with `requestAnimationFrame`. Enforced a 500-item circular buffer on `logs` in `usePipelineTelemetry.ts`. Paused 1500ms REST polling while WebSocket status is `LIVE`. Added copy-to-clipboard affordance for log messages.
  - Verification: `npx tsc --noEmit` clean, `npm run lint` clean.

- [x] **TASK-06: Resolve WCAG AA Accessibility, Contrast, Labels & Motion (P1)**
  - Route: delegated direct (`4ead9953-e218-4822-88bf-131a63873dc8`)
  - Commit: `f65680f`
  - Details: Elevated placeholder and timestamp contrast to >= 4.5:1. Added `<label className="sr-only">` and `aria-label` to search inputs and filter selects. Added `role="tablist"` / `aria-selected` to manual use cases and `tabIndex={0}` to code blocks. Added respectful `@media (prefers-reduced-motion: reduce)` in `globals.css`.
  - Verification: `npx tsc --noEmit` clean, `npm run lint` clean.

- [x] **TASK-07: Wire Breadcrumbs, Cleanup Duplicate Indicators & Eliminate AI Slop (P2/P3)**
  - Route: direct inline
  - Commit: `fc7bf00`
  - Details: Wired `Breadcrumbs` component inside `AppNavbar.tsx` and passed items from execution detail page. Deduplicated `ConnectionIndicator` in header. Removed redundant nested `<ReactFlowProvider>`. Removed unmeaningful gradient texts (`bg-clip-text bg-gradient-to-r`). Allowed text selection in `MetricCard.tsx`.
  - Verification: Impeccable detector returned 0 warnings (`[]`), `npx tsc --noEmit` clean, `npm run lint` clean.

## Verification & Checks Summary
- TypeScript build (`npx tsc --noEmit`): PASSED (0 errors).
- ESLint (`npm run lint`): PASSED (0 warnings, 0 errors).
- Impeccable detector (`cmd /c ".agent\skills\impeccable\scripts\impeccable.cmd detect --json src"`): PASSED (0 warnings, clean output).
