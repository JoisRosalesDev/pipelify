# Delta for Realtime Pipeline Orchestration

## ADDED Requirements

### Requirement: Landing Page Manual Navigation Action

The landing page hero section MUST render an action button labeled "Manual" directing the user to `/manual`, replacing the legacy "Explorar Ejecución" button.

#### Scenario: User clicks Manual button on landing page
- GIVEN a user on the landing page (`/`)
- WHEN the user clicks the "Manual" action button in the hero section
- THEN the system MUST navigate to `/manual`
- AND the legacy "Explorar Ejecución" button linking to `/executions/demo-execution-id` MUST NOT be displayed
