# Proposal: Web Compliance and Accessibility (WCAG 2.1/2.2 AA & Regulations)

## Intent

Pipelify currently violates essential Web Content Accessibility Guidelines (WCAG 2.1/2.2 AA) and accessibility laws (European Accessibility Act 2025, Chilean Law 20.422). Specifically, mobile zoom is explicitly disabled, form inputs in configuration panels lack programmatic label associations, interactive console controls rely on non-semantic clickable `div` elements without keyboard access, and icon-only buttons lack accessible names (`aria-label`).

This change rectifies all non-compliant accessibility and regulatory shortcomings currently present in the codebase, establishing WCAG 2.1/2.2 AA compliance and automated accessibility linting guards.

## Scope

### In Scope
- **Viewport Scalability (WCAG 1.4.4)**: Remove `userScalable: false` and `maximumScale: 1` from `src/app/layout.tsx` so users with low vision can pinch-to-zoom on mobile devices.
- **Form Controls & Labels (WCAG 1.3.1, 4.1.2)**: Connect all `<label>` tags with matching `<input id="...">` / `<select id="...">` attributes across `NodeConfigPanel.tsx`.
- **Keyboard Navigation & Semantics (WCAG 2.1.1, 4.1.2)**:
  - Replace clickable `div` in `ExecutionLogsTable.tsx` header with semantic `<button>` elements equipped with `aria-expanded` and keyboard triggers.
  - Add accessible names (`aria-label`) to all icon-only buttons across `NodeConfigPanel.tsx`, `SidebarPalette.tsx`, and `ExecutionLogsTable.tsx`.
  - Add `role="region"`, `role="log"`, and `aria-live="polite"` to `ExecutionLogsTable.tsx` for real-time assistive technology announcements.
- **Accessible Landmarks & Dialog Semantics**:
  - Add proper ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`, `aria-label`) to `NodeConfigPanel.tsx` and `MobileBottomSheet.tsx`.
- **Accessibility Linting**: Configure `eslint-plugin-jsx-a11y` to prevent future accessibility regressions.

### Out of Scope
- Marketing cookie consent banner (no third-party tracking or non-essential cookies exist in the project; implementing a banner without third-party tracking violates ePrivacy/GDPR minimal friction guidelines).
- User authentication and ARCO rights account deletion backend workflows (Pipelify does not currently manage user accounts; deferred until multi-tenant auth is implemented).

## Capabilities

### New Capabilities
- `web-accessibility-compliance`: End-to-end accessibility compliance providing WCAG 2.1/2.2 AA conformance across all interactive UI controls, mobile viewport scaling, ARIA live logging, and automated JSX accessibility linting.

### Modified Capabilities
- `realtime-pipeline-orchestration`: Enhances the pipeline canvas, node configuration panels, and live telemetry execution console with keyboard accessibility, semantic HTML controls, and screen reader announcements.

## Approach

1. **Update Viewport Metadata**: Modify `viewport` in `src/app/layout.tsx` to enable user zoom (`userScalable: true` or default).
2. **Refactor Form Inputs in `NodeConfigPanel.tsx`**: Add unique `id` attributes to every input, select, and textarea, linking them directly to corresponding `<label htmlFor="...">` tags.
3. **Enhance Console Semantics in `ExecutionLogsTable.tsx`**: Replace custom click handlers on `div` elements with `<button>` elements, add `aria-expanded` state, and assign `aria-live="polite"` / `role="log"` to the log container.
4. **Audit and Apply `aria-label` Attributes**: Ensure all icon-only action buttons (close panel, add node, clear logs, minimize) have clear descriptive text for screen readers.
5. **Install and Configure Accessibility Linter**: Add `eslint-plugin-jsx-a11y` rules to enforce accessibility compliance during linting.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modified | Enable responsive pinch-to-zoom by removing zoom lock in viewport config |
| `src/components/organisms/NodeConfigPanel.tsx` | Modified | Add `id`/`htmlFor` pairings and `aria-label` to close/delete buttons |
| `src/components/organisms/ExecutionLogsTable.tsx` | Modified | Convert header toggle to `<button>`, add ARIA live region and accessible labels |
| `src/components/organisms/SidebarPalette.tsx` | Modified | Add `aria-label` to node insertion buttons |
| `src/components/molecules/MobileBottomSheet.tsx` | Modified | Add `role="dialog"` and `aria-label` for mobile sheet accessibility |
| `package.json` | Modified | Add `eslint-plugin-jsx-a11y` dev dependency |
| `eslint.config.mjs` | Modified | Enable JSX accessibility rules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile canvas gesture conflicts with browser zoom | Low | React Flow handles canvas panning/zooming via its internal gesture manager without depending on viewport zoom lock |
| ESLint flat config compatibility issues | Low | Verify `eslint-plugin-jsx-a11y` flat config export with ESLint 8/9 |

## Rollback Plan

Revert git commits modifying `layout.tsx`, `NodeConfigPanel.tsx`, `ExecutionLogsTable.tsx`, `SidebarPalette.tsx`, and ESLint configurations.

## Dependencies

- `eslint-plugin-jsx-a11y` (development dependency)

## Success Criteria

- [ ] Mobile pinch-to-zoom is enabled in `src/app/layout.tsx` without viewport zoom blocking.
- [ ] 100% of form controls in `NodeConfigPanel.tsx` have programmatically associated `<label htmlFor="...">` elements.
- [ ] All icon-only buttons contain descriptive `aria-label` attributes.
- [ ] Real-time log table is navigable via keyboard (`Tab`, `Enter`, `Space`) and exposes `role="log"` with `aria-live="polite"`.
- [ ] ESLint passes with `jsx-a11y` rules enabled and zero errors.
