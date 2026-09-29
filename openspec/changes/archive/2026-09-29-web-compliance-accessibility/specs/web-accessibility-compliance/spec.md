# Web Accessibility Compliance Specification

## Purpose

This specification defines the standards and operational requirements for WCAG 2.1/2.2 AA accessibility compliance across Pipelify. It ensures that users of assistive technologies, screen readers, and adaptive zooming devices can perceive, operate, and navigate all core application interfaces without altering or degrading any existing ETL functionality, reactive state management, or visual aesthetics.

## Requirements

### Requirement: Viewport Scalability and Zoom Independence

The application root layout MUST allow user-initiated scaling and magnification on mobile and touch devices up to at least 200% without hindrance, complying with WCAG 2.1 Success Criterion 1.4.4 (Resize Text).

The viewport configuration MUST NOT set `userScalable: false` or restrict `maximumScale` below standards.

#### Scenario: Mobile user zooms the viewport

- GIVEN a user accessing Pipelify on a mobile viewport or touch-screen browser
- WHEN the user performs a pinch-to-zoom or multi-touch magnification gesture
- THEN the browser MUST smoothly scale the page content up to 200% or greater
- AND the canvas pan/zoom gestures inside React Flow MUST continue functioning without interception or visual degradation

#### Scenario: Responsive default scale preservation

- GIVEN a user navigating to any page (`/`, `/pipelines`, `/manual`, `/executions/[id]`) on any screen size
- WHEN the initial DOM and layout are rendered
- THEN the initial scale MUST render at 1:1 (`initialScale: 1`)
- AND content layout MUST adapt responsively without horizontal overflow or broken styling

---

### Requirement: Programmatic Form Control and Label Association

Every interactive form control in configuration panels (text inputs, selects, number steppers, and checkboxes) MUST be programmatically associated with its descriptive label using matching `id` and `htmlFor` attributes, satisfying WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value).

Updating label and input markup MUST NOT mutate state bindings, default values, form submission behavior, or validation logic.

#### Scenario: Screen reader inspects ETL node configuration inputs

- GIVEN a user using a screen reader (such as NVDA, JAWS, or VoiceOver) focused on the Node Configuration Panel
- WHEN the user tabs to any input field (e.g., node label, connection source, SQL filter, batch size, or timeout)
- THEN the screen reader MUST announce the exact accessible label text associated via `htmlFor`
- AND clicking or tapping the label element MUST shift keyboard focus directly to the target input control

#### Scenario: Node configuration update retains data persistence

- GIVEN an open Node Configuration Panel for an extractor, transformer, or loader node
- WHEN the user edits input values associated with accessible labels and submits the form
- THEN the node configuration state MUST update exactly as before with unchanged payload structures
- AND all reactive telemetry metrics and canvas node labels MUST remain synchronized

---

### Requirement: Accessible Names for Icon-Only Interactive Elements

All interactive buttons and controls that render only iconography without visible text MUST provide an accessible name via `aria-label` or visually hidden text, satisfying WCAG 2.1 Success Criterion 4.1.2 (Name, Role, Value).

Adding accessible attributes MUST NOT change the visual geometry, button dimensions, hover animations, or touch hit-targets.

#### Scenario: User navigates icon-only action buttons via screen reader

- GIVEN interactive controls such as the panel close button, delete node button, add-to-canvas palette button, or console clear/minimize buttons
- WHEN a screen reader or keyboard focus lands on the control
- THEN the screen reader MUST announce a concise, unambiguous action name (e.g., "Cerrar panel de configuración", "Eliminar nodo del lienzo", "Agregar nodo Extractor al lienzo", "Limpiar consola de eventos")
- AND the visual layout, icon rendering, and color transitions MUST remain completely unchanged

---

### Requirement: Real-Time Telemetry Log Stream Accessibility

The real-time execution log table MUST notify assistive technologies of incoming streaming events without displacing keyboard focus or interrupting the user, complying with WCAG 2.1 Success Criterion 4.1.3 (Status Messages).

#### Scenario: Execution receives live streaming WebSocket logs

- GIVEN an active pipeline execution with real-time WebSocket streaming connected
- WHEN new execution logs or telemetry events are received from the backend
- THEN the log container with `role="log"` and `aria-live="polite"` MUST expose the updates to assistive technologies
- AND visual auto-scrolling, level filtering (INFO, WARN, ERROR, SUCCESS), and log viewer row styles MUST function without deviation

#### Scenario: Minimizing and expanding the console via keyboard

- GIVEN the execution logs console
- WHEN a keyboard user focuses the console header and presses `Enter` or `Space`
- THEN the console MUST toggle between minimized and expanded states
- AND the toggle control MUST reflect its status via `aria-expanded="true"` or `aria-expanded="false"`

---

### Requirement: Automated Accessibility Linting Rules

The project development environment MUST incorporate automated JSX accessibility linting via `eslint-plugin-jsx-a11y` integrated into the project's ESLint configuration.

#### Scenario: Developer runs code linting in CI/CD or local environment

- GIVEN the codebase with ESLint configuration
- WHEN the developer or CI runner executes `npm run lint`
- THEN the linter MUST validate all JSX markup against standard accessibility rules (e.g., label association, button semantics, alt tags, and ARIA attributes)
- AND build commands (`npm run build`) MUST proceed without syntax errors or packaging conflicts
