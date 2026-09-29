# Design: Web Compliance and Accessibility Remediation

## Technical Approach

This technical design details the implementation strategy for bringing Pipelify into full WCAG 2.1/2.2 AA and digital accessibility legal compliance (EAA 2025, Chilean Law 20.422). 

The remediation adheres strictly to two core constraints:
1. **Zero Functional Mutation**: All WebSocket subscriptions, reactive state hooks, React Flow canvas pan/zoom gestures, form submission payloads, and DAG orchestrations remain functionally identical.
2. **Visual Coherence & Art Direction**: Any modified or newly introduced user-visible component strictly adopts Pipelify's Atomic Design design tokens—dark-first palette (`zinc-900`/`zinc-950`), blue accents (`blue-600`/`blue-500`), subtle borders (`border-zinc-800`), standard font stacks (`Inter` and `JetBrains Mono`), and rounded container radiuses (`rounded-lg`, `rounded-xl`).

---

## Architecture Decisions

### Decision: Viewport Pinch-to-Zoom Unlocking

**Choice**: Modify `src/app/layout.tsx` `viewport` export to remove `userScalable: false` and `maximumScale: 1`. Retain `width: "device-width"`, `initialScale: 1`, and `themeColor: "#09090b"`.  
**Alternatives considered**: 
- *Keeping zoom locked to prevent React Flow canvas touch conflicts*: Rejected. WCAG 1.4.4 strictly forbids disabling browser zoom. React Flow v12 handles multi-touch canvas panning and viewport gestures internally without requiring root viewport zoom disabling.  
**Rationale**: Enables low-vision users to magnify the web app while maintaining responsive default scaling and canvas interactivity.

### Decision: Programmatic Form Control ID Scoping

**Choice**: In `NodeConfigPanel.tsx`, associate each `<label>` with its input using deterministic, scoped IDs: `node-cfg-label-${node.id}`, `node-cfg-source-${node.id}`, `node-cfg-table-${node.id}`, `node-cfg-query-${node.id}`, `node-cfg-limit-${node.id}`, `node-cfg-transform-${node.id}`, `node-cfg-fn-${node.id}`, `node-cfg-dest-${node.id}`, `node-cfg-dest-table-${node.id}`, `node-cfg-mode-${node.id}`, `node-cfg-batch-${node.id}`, `node-cfg-retry-${node.id}`, `node-cfg-timeout-${node.id}`.  
**Alternatives considered**: 
- *Wrapping `<input>` directly inside `<label>` without IDs*: Rejected because Tailwind layout flex/grid structures in the existing form expect independent label and input block elements.  
- *Static IDs without node ID prefix*: Rejected because if multiple panels or canvas nodes are unmounted/remounted, duplicate DOM IDs could collide.  
**Rationale**: Guaranteed unique DOM association per node instance satisfying WCAG 1.3.1 and 4.1.2 without modifying visual layout or form state handling.

### Decision: Semantic `<button>` Refactor in Execution Console Header

**Choice**: Replace the outer clickable `<div onClick={handleToggle}>` in `ExecutionLogsTable.tsx` with a native HTML `<button type="button" onClick={handleToggle} aria-expanded={!isMinimized} aria-controls="execution-logs-container">`.  
**Alternatives considered**: 
- *Adding `tabIndex={0}` and `onKeyDown` to the `div`*: Rejected. Custom interactive `div` elements require manually replicating keyboard events, focus indicators, disabled states, and ARIA roles. Native `<button>` provides built-in `Enter`/`Space` activation, native focus ring, and screen reader announcements with zero overhead.  
**Rationale**: Perfect keyboard accessibility with 100% preservation of the compact mobile-optimized single-line layout and styling.

### Decision: New Visible Component `SkipToContent` with Pipelify Art Direction

**Choice**: Introduce `src/components/atoms/SkipToContent.tsx` rendered at the top of `src/app/layout.tsx`.  
**Aesthetic Specifications**:
- Off-screen by default (`sr-only`), smoothly translates into view on keyboard focus (`focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50`).
- Styled using Pipelify's primary design tokens: `px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold shadow-lg border border-blue-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-all`.  
**Alternatives considered**:
- *Omitting skip link*: Violates WCAG 2.4.1 (Bypass Blocks) on pages with navigation bars.  
- *Generic unstyled browser link*: Clashes with the dark DevTool aesthetic.  
**Rationale**: Guarantees compliance and keyboard ergonomics while remaining visually invisible to mouse users and impeccably on-brand when focused.

### Decision: Accessible Live Region for Streaming Logs

**Choice**: Assign `role="log"`, `aria-live="polite"`, `aria-atomic="false"`, and `id="execution-logs-container"` to the logs scroll container in `ExecutionLogsTable.tsx`.  
**Alternatives considered**:
- *`aria-live="assertive"`*: Rejected. Assertive live regions interrupt current speech output on every single log event, which would overwhelm screen reader users during high-throughput ETL stream execution.  
**Rationale**: `aria-live="polite"` queues announcements gracefully when the screen reader is idle.

---

## Data Flow

The following diagram illustrates how accessibility metadata overlays existing reactive telemetry flows without altering runtime execution:

```
[ WebSocket Server / API ]
          │
          │ (WSEventPayload)
          ▼
[ usePipelineTelemetry Hook ]
          │
          ├──→ Updates reactive state (nodes, logs, status)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Visual Presentation Layer (WCAG 2.1/2.2 AA Overlay)        │
│                                                             │
│  [ SkipToContent ] ──→ Shifts focus to <main id="main-content">
│                                                             │
│  [ CustomETLNode ] ──→ Focus rings, semantic status badges  │
│                                                             │
│  [ NodeConfigPanel ]                                        │
│     ├── <label htmlFor="node-cfg-...">                      │
│     └── <input id="node-cfg-...">                           │
│                                                             │
│  [ ExecutionLogsTable ]                                     │
│     ├── <button aria-expanded="..."> (Header toggle)        │
│     └── <div role="log" aria-live="polite"> (Live updates)  │
└─────────────────────────────────────────────────────────────┘
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/atoms/SkipToContent.tsx` | Create | New accessible skip navigation component matching Pipelify design tokens |
| `src/app/layout.tsx` | Modify | Unlock mobile zoom in `viewport` metadata and insert `<SkipToContent />` |
| `src/app/page.tsx` | Modify | Add `id="main-content"` to `<main>` landmark |
| `src/app/manual/page.tsx` | Modify | Add `id="main-content"` to `<main>` landmark |
| `src/app/(dashboard)/pipelines/page.tsx` | Modify | Wrap dashboard body in `<main id="main-content">` landmark |
| `src/app/(dashboard)/executions/[executionId]/page.tsx` | Modify | Wrap execution canvas in `<main id="main-content">` landmark |
| `src/components/organisms/NodeConfigPanel.tsx` | Modify | Connect `<label htmlFor>` to `<input id>`, add `aria-label` to close/delete buttons, set `role="region"` |
| `src/components/organisms/ExecutionLogsTable.tsx` | Modify | Replace clickable `div` with `<button>`, add `role="log"`, `aria-live="polite"`, `aria-expanded`, and `aria-label`s |
| `src/components/organisms/SidebarPalette.tsx` | Modify | Add `aria-label` to node creation buttons with specific type context |
| `src/components/molecules/MobileBottomSheet.tsx` | Modify | Add `role="dialog"`, `aria-modal="true"`, and `aria-label` with accessible close button |
| `package.json` | Modify | Add `eslint-plugin-jsx-a11y` under devDependencies |
| `eslint.config.mjs` | Modify | Configure JSX accessibility rules in ESLint |

---

## Interfaces / Contracts

### New Component: `SkipToContent`

```typescript
export interface SkipToContentProps {
  targetId?: string; // Default: "main-content"
  label?: string;    // Default: "Saltar al contenido principal"
  className?: string;
}
```

### Form Input ID Generator Utility (Inlined or scoped in `NodeConfigPanel.tsx`)

```typescript
const getFieldId = (nodeId: string, fieldName: string): string =>
  `node-cfg-${nodeId}-${fieldName}`;
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Linter / Static | JSX accessibility compliance | Execute `npm run lint` with `eslint-plugin-jsx-a11y` enabled |
| Build / Compilation | Next.js compilation & types | Execute `npm run build` to verify zero type mismatches or breaking JSX |
| Functional / Visual | Layout scaling & canvas interaction | Manual & browser testing: verify zoom scale, React Flow pan/zoom gestures, form saving, log table minimization |
| Keyboard Navigation | Full keyboard operability | Tab navigation verification through SkipToContent, nav links, forms, and console controls with `Enter`/`Space` |

---

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

---

## Migration / Rollout

No database migrations or feature flags required. All changes are frontend-contained, progressive enhancements that take effect immediately upon deployment.

---

## Open Questions

- None. All requirements and design tokens are established and aligned with the existing codebase.
