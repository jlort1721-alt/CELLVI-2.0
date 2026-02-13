# Enterprise Development & Deployment Protocol
**Protocol ID:** CELLVI-DEV-001
**Status:** ACTIVE
**Enforcement:** MANDATORY

## 1. Core Philosophy
"Si no es robusto, seguro y auditable, no está terminado."
Every change must be Production-Grade, Enterprise-Scale, and Security-First.

## 2. Development Workflow (The "Golden Path")

### Step 1: Feature Branch
- Base off `main`.
- Naming convention: `feat/feature-name`, `fix/issue-desc`, `refactor/module`.
- **Action:** `git checkout -b feat/scaling-infrastructure`

### Step 2: Implementation & Validation
- **Code:** Write Clean Code (SOLID) with strict TypeScript types.
- **Database:** Changes via Supabase Migrations (`supabase/migrations/TIMESTAMP_name.sql`).
- **Security:** Always verify RLS policies and `tenant_id` isolation.
- **Validation:** Run local build (`npm run build`) and DB push (`supabase db push`) to catch errors early.

### Step 3: Documentation
- Update `docs/ARCHITECTURE.md` if architectural patterns change.
- Update `docs/SECURITY_AUDIT.md` if security posture changes.
- **New Requirement:** Add entry to `docs/CHANGELOG.md`.

### Step 4: Pull Request & Merge
- Create PR via GitHub CLI (`gh pr create`).
- **Description:** Must include Context, Changes, Validation steps, and Risks.
- **Merge:** Only merge to `main` after CI checks pass (Lint/Build).

### Step 5: Production Deployment
- **Database:** `supabase db push` (idempotent migrations).
- **Frontend:** Vercel auto-deploys `main` branch.
- **Verification:** Run smoke tests on production URL.

## 3. Infrastructure Standards

### Scaling & Performance
- **Spatial Data:** Always use GIST indexes for `geometry`/`geography` columns.
- **Hot Data:** Use caching tables (e.g., `vehicle_last_positions`) for high-frequency reads.
- **Partitioning:** Plan partitioning for tables expected to exceed 10M rows (`telemetry`, `logs`).

### Security Hardening
- **Secrets:** Never commit `.env` or API keys. Use placeholders in docs.
- **RLS:** Every table must have RLS enabled and a policy linking to `auth.uid()` or `tenant_id`.
- **Audit:** All critical actions (CRUD on Assets, Users) must be logged to `audit_ledger`.

## 4. Operational Excellence
- **Schema Drift:** Avoid it by always using migrations, never manual SQL in dashboard.
- **backups:** Verify PITR is active before major migrations.
- **Monitoring:** Check Vercel Analytics and Supabase Logs after deployment.

---
**Maintained by:** Antigravity AI Agent
**Context:** CELLVI 2.0 Enterprise Certification
