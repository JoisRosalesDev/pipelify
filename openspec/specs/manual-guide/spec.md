# Manual Guide Specification

## Purpose

Define requirements and acceptance criteria for the interactive `/manual` documentation page in Pipelify, presenting 3 core ETL pipeline use cases with structured, step-by-step instructions.

## Requirements

### Requirement: Display Three Core ETL Use Cases

The `/manual` page MUST display 3 structured, real-world ETL use cases with clear sequential steps:
1. **Sales Synchronization (PostgreSQL -> BigQuery)**: Continuous extraction, currency field normalization, and compressed Parquet analytical ingestion.
2. **User Segmentation & ML Pipeline (Redis -> S3)**: Event stream ingestion, feature vectorization, and data lake storage.
3. **Daily Inventory Cleanup (ERP -> Redis)**: Stock extraction, delta calculation/reconciliation, and cache warming.

Each use case MUST present:
- Use Case Title, Description, and ETL Node Summary.
- Prerequisites & Environment Configuration.
- Step-by-Step workflow: 1. Extract Config, 2. Transform Logic, 3. Load Target, 4. Telemetry Verification.
- Direct execution CTA linking to `/executions/{pipelineId}` or launching sample DAG.

#### Scenario: User reviews use case steps
- GIVEN a user navigating to `/manual`
- WHEN the user views the available ETL use cases
- THEN the system MUST render all 3 use cases with distinct step-by-step guides and execution links

#### Scenario: User triggers sample execution from manual
- GIVEN a user viewing a specific use case on `/manual`
- WHEN the user clicks the "Ejecutar Caso" or "Abrir Canvas" action button
- THEN the system MUST navigate the user to the corresponding pipeline canvas or active execution telemetry view

### Requirement: Responsive Layout and Theme Consistency

The `/manual` page MUST integrate with `AppNavbar`, display breadcrumbs (`Home / Manual`), support dark and light theme tokens, and maintain mobile responsiveness.

#### Scenario: Responsive navigation and breadcrumbs
- GIVEN a user on desktop or mobile device
- WHEN visiting `/manual`
- THEN the system MUST render the `AppNavbar` with breadcrumbs `Home / Manual` and responsive step cards
