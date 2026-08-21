# Proposal: Manual Page with 3 Use Cases

## Intent

Users exploring Pipelify need clear, structured guidance to understand how to design, execute, and monitor ETL pipelines. Adding a dedicated "Manual" page showcasing 3 concrete real-world use cases with step-by-step instructions enables rapid onboarding and understanding of DAG orchestration, replacing the placeholder "Explorar Ejecución" button on the landing page.

## Scope

### In Scope
- Create `/manual` page with structured step-by-step instructions for 3 ETL use cases:
  1. PostgreSQL to BigQuery Sales Synchronization (Continuous Extraction & Batch Ingestion)
  2. Redis Stream to AWS S3 ML Feature Vectorization (Real-Time Feature Engineering)
  3. ERP to Redis Inventory Reconciliation & Stock Delta Cleanup (Scheduled Cache Sync)
- Update landing page (`src/app/page.tsx`) to replace "Explorar Ejecución" button with "Manual" button linking to `/manual`.
- Ensure responsive design, Dark/Light theme consistency, and interactive step navigation.

### Out of Scope
- Modifying FastAPI backend execution logic or Celery workers.
- New database tables or Prisma migrations.
- PDF generation/export of manual documentation.

## Capabilities

### New Capabilities
- `manual-guide`: Interactive documentation page presenting 3 structured ETL use-case walkthroughs with step-by-step execution workflows.

### Modified Capabilities
- `realtime-pipeline-orchestration`: Landing page primary navigation CTA update from "Explorar Ejecución" to "Manual".

## Approach

1. Create `src/app/manual/page.tsx` utilizing existing atomic components (`AppNavbar`, `ActionButton`, `StatusBadge`, `MetricCard`).
2. Structure each use case with Prerequisites, DAG Node Configuration, Execution Trigger, and Live Telemetry Verification.
3. Update `src/app/page.tsx` hero CTA button label, icon (`BookOpen`), and target link (`/manual`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modified | Update CTA button text from "Explorar Ejecución" to "Manual" and link to `/manual` |
| `src/app/manual/page.tsx` | New | Dedicated Manual page displaying the 3 ETL use cases and step-by-step guide |
| `src/components/organisms/AppNavbar.tsx` | Modified | Ensure breadcrumb navigation compatibility with `/manual` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistency with DAG sample formats | Low | Align manual node configs directly with `SAMPLE_PIPELINES` schema |
| Theme/styling mismatch | Low | Use standard Tailwind classes and existing Atomic Design components |

## Rollback Plan

Revert `src/app/page.tsx` button label/link and remove `src/app/manual/page.tsx`.

## Dependencies

- `lucide-react` (icons: `BookOpen`, `Layers`, `Play`, `CheckCircle2`)
- Next.js App Router

## Success Criteria

- [ ] Landing page CTA displays "Manual" and links directly to `/manual`.
- [ ] `/manual` page renders 3 complete ETL use-case guides with clear sequential steps.
- [ ] Page adheres to responsive layout, accessibility, and light/dark theme standards.
