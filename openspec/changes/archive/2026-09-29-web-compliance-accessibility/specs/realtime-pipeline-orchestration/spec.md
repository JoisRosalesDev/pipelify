# Delta for Realtime Pipeline Orchestration

## ADDED Requirements

### Requirement: Keyboard-Navigable and Semantic Execution Console Controls

The execution telemetry console header bar and actions MUST be implemented using native semantic `<button>` elements with complete keyboard support (`Tab`, `Enter`, `Space`) and dynamic `aria-expanded` status, replacing any clickable non-semantic `div` containers.

These accessibility enhancements MUST preserve all existing interactive states, toggle animations, height transitions, search filtering, and log clearing behavior without regressions.

#### Scenario: User toggles execution console using keyboard

- GIVEN a user viewing an active or completed execution at `/executions/[executionId]`
- WHEN the user presses `Tab` to navigate focus to the execution console header toggle button
- AND the user presses `Enter` or `Space`
- THEN the execution console MUST toggle its height between collapsed (40px) and expanded (176px - 208px)
- AND the button's `aria-expanded` attribute MUST update accordingly
- AND all active WebSocket log subscriptions and auto-scroll behaviors MUST continue uninterrupted

#### Scenario: Filter selection and log clearance preserve telemetry state

- GIVEN the expanded execution console with existing telemetry logs
- WHEN the user selects a log level filter or activates the "Limpiar" button via keyboard or mouse
- THEN the filter state or log buffer clear action MUST execute with identical functionality
- AND the connection indicator and DAG execution state MUST remain completely intact

---

### Requirement: Accessible Dialog Landmarks for Node Configuration Panels

The desktop Node Configuration Panel and mobile bottom sheet drawer MUST be exposed as accessible landmarks with `role="region"` or `role="dialog"`, accompanied by `aria-label="Configuración de Nodo ETL"`.

The structural semantics MUST NOT alter the desktop slide-in positioning, mobile touch gesture handling, or node data synchronization.

#### Scenario: User selects a node on the canvas to configure parameters

- GIVEN a user on the DAG canvas
- WHEN the user clicks or activates an ETL node (extractor, transformer, or loader)
- THEN the Node Configuration Panel MUST open with accessible dialog semantics
- AND the user MUST be able to close the panel using the accessible close button (`aria-label="Cerrar panel de configuración"`) or by deselecting the node
- AND all node data update callbacks (`onUpdateConfig`) MUST dispatch with the exact existing signature and values
