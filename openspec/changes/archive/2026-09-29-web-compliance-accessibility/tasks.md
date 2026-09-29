# Tasks: Web Compliance and Accessibility Remediation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150 - 220 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full Web Compliance & WCAG 2.1/2.2 AA Remediation | PR 1 | `npm run lint && npm run build` | Next.js dev server (`/`, `/pipelines`, `/executions/[id]`, `/manual`) | Revert changes in modified components and `layout.tsx` |

---

## Phase 1: Foundation, Tooling & Layout Accessibility

- [x] 1.1 Install `eslint-plugin-jsx-a11y` as a dev dependency in `package.json`
- [x] 1.2 Configure `eslint.config.mjs` / `.eslintrc.json` to enable JSX accessibility linting rules
- [x] 1.3 Create `src/components/atoms/SkipToContent.tsx` adhering to Pipelify's dark-mode design tokens (`bg-blue-600`, `text-white`, `font-sans`, `rounded-lg`, `ring-blue-400`)
- [x] 1.4 Update `src/app/layout.tsx` to unlock mobile zoom in `viewport` metadata and insert `<SkipToContent />`
- [x] 1.5 Add `id="main-content"` landmarks to `<main>` containers in `src/app/page.tsx`, `src/app/manual/page.tsx`, `src/app/(dashboard)/pipelines/page.tsx`, and `src/app/(dashboard)/executions/[executionId]/page.tsx`

## Phase 2: Form Accessibility Remediation (WCAG 1.3.1 & 4.1.2)

- [x] 2.1 Refactor `src/components/organisms/NodeConfigPanel.tsx` to link all form `<label>` tags with deterministic `<input id="...">` / `<select id="...">` attributes using `node-cfg-${node.id}-${field}`
- [x] 2.2 Add `aria-label="Cerrar panel de configuración"` and `aria-label="Eliminar nodo del lienzo"` to icon-only buttons in `src/components/organisms/NodeConfigPanel.tsx`, and assign `role="region"` with `aria-label="Configuración de Nodo ETL"` to the panel container
- [x] 2.3 Update `src/components/molecules/MobileBottomSheet.tsx` with `role="dialog"`, `aria-modal="true"`, and `aria-label="Configuración de Nodo ETL Móvil"`

## Phase 3: Interactive Controls, Teletype Live Logging & Icon Semantics (WCAG 2.1.1 & 4.1.3)

- [x] 3.1 Refactor the console header toggle in `src/components/organisms/ExecutionLogsTable.tsx` from clickable `div` to a semantic `<button type="button">` with `aria-expanded={!isMinimized}` and full keyboard support (`Enter` / `Space`)
- [x] 3.2 Add `role="log"`, `aria-live="polite"`, `aria-atomic="false"`, and `id="execution-logs-container"` to the scrollable logs stream in `src/components/organisms/ExecutionLogsTable.tsx`
- [x] 3.3 Add `aria-label` attributes to console action buttons (clear logs, auto-scroll, minimize) in `src/components/organisms/ExecutionLogsTable.tsx`
- [x] 3.4 Add `aria-label={`Agregar nodo ${item.label} al lienzo`}` to node insertion action buttons in `src/components/organisms/SidebarPalette.tsx`

## Phase 4: Verification, Linting & Runtime Integrity Checks

- [x] 4.1 Run `npm run lint` and verify zero ESLint errors with `jsx-a11y` active
- [x] 4.2 Run `npm run build` and verify that the production build compiles successfully with zero TypeScript or JSX bundling issues
- [x] 4.3 Verify in browser and keyboard tab navigation that `<SkipToContent />` shifts focus, form inputs are navigable, console toggles via keyboard, and React Flow canvas pan/zoom behaves without regressions
