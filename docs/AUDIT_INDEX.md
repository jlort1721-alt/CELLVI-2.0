# Audit Index: CELLVI 2.0 (Compliance Map)

Este índice referencia evidencias y controles para auditorías tipo SOC 2 / ISO 27001.
**Regla:** Todas las rutas son relativas a la raíz del repositorio.

## 1. Governance & Policies
*   **Superuser Control (Break-Glass):** `docs/ops/SUPERUSER_POLICY.md`
*   **Change Management (Go-Live Authority):** `docs/ops/GO_LIVE_APPROVAL.md`
*   **Secret Management & Rotation:** `docs/ops/SECRET_ROTATION.md`
*   **Incident Response / Runbooks:** `docs/ops/RUNBOOKS.md`
*   **Canary Release Strategy:** `docs/ops/CANARY_RELEASE_STRATEGY.md`
*   **Evidence Retention:** `docs/ops/EVIDENCE_RETENTION.md`

## 2. Technical Controls (Evidence)
*   **WORM Immutability (audit_logs, slo_reports):** `supabase/migrations/20260212235500_phase11_immutability.sql`
*   **Forensic Chain Verification:** `scripts/audit_chain_verify.js`
*   **Multi-Tenant Isolation Test Suite (RLS):** `tests/rls_safety_test.js`
*   **Disaster Recovery Backup/Restore:** `scripts/dr_backup_restore.sh`

## 3. Monitoring & Operational Controls
*   **Observability Views / Ops Health:** `supabase/migrations/20260212220000_phase7_observability.sql`
*   **Alert Watchtower (Slack/Email):** `supabase/functions/alert-monitor/index.ts`
*   **Rate Limiting / Quotas:** `supabase/migrations/20260212230000_phase8_ratelimits.sql`
*   **SLO Evidence Repo (slo_reports):** `supabase/migrations/20260212233000_phase9_certification.sql`
*   **SLO Reporter Function:** `supabase/functions/slo-reporter/index.ts`

## 4. Audit Tools & Certification Gates
*   **Audit Tools (RNDC Ledger, RateLimit Compliance):** `supabase/migrations/20260212234500_phase10_audit_tools.sql`
*   **GO/NO-GO Protocol:** `docs/ops/GO_NO_GO_PROTOCOL.md`
*   **Evidence Pack Generator:** `scripts/generate_type2_evidence_pack.sh`

## 5. Final Handover
*   **Operational Handover Letter:** `docs/FINAL_OPS_HANDOVER.md`
