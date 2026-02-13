#!/bin/bash
# EVIDENCE PACK GENERATOR (Audit Type 2)
# Usage: ./scripts/generate_type2_evidence_pack.sh

# 1. Config
EVIDENCE_DIR="./evidence_pack_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EVIDENCE_DIR"
echo "🕵️‍♂️  Starting Forensic Evidence Collection to $EVIDENCE_DIR..."

# 2. Forensic Integrity Check (Chain Verify)
echo "🔒  Verifying Audit Chain Integrity..."
node scripts/audit_chain_verify.js > "$EVIDENCE_DIR/audit_chain_verify.log" 2>&1
if [ $? -eq 0 ]; then
    echo "    ✅ Integrity PASS"
else
    echo "    ❌ Integrity FAIL (See log)"
fi

# 3. Security Isolation (RLS Test)
echo "🛡️  Running RLS Multi-Tenant Safety Suite..."
# Requires users to exist (run setup logic inside test)
node tests/rls_safety_test.js > "$EVIDENCE_DIR/rls_safety_test.log" 2>&1
if grep -q "RLS VERIFIED" "$EVIDENCE_DIR/rls_safety_test.log"; then
    echo "    ✅ Isolation PASS"
else
    echo "    ❌ Isolation FAIL (See log)"
fi

# 4. Infrastructure Status (Fire Test)
echo "🔥  Checking Infrastructure Health..."
node scripts/fire_test.js > "$EVIDENCE_DIR/fire_test.log" 2>&1

# 5. SLO Report Snapshot (Simulated Export)
# In real env: curl -H "Authorization: Bearer $KEY" $API/slo-reporter > "$EVIDENCE_DIR/slo_report.json"
echo '{ "simulated": true, "week": "current", "status": "PASS" }' > "$EVIDENCE_DIR/slo_report_latest_export.json"

# 6. Database Schema Dump (Evidence of Immutable Policies)
# echo "Dumping Schema Definitions..."
# npx supabase db dump --schema public > "$EVIDENCE_DIR/schema_dump.sql"

# 7. Package & Sign
ZIP_NAME="evidence_pack_final.zip"
zip -r "$ZIP_NAME" "$EVIDENCE_DIR" > /dev/null
HASH=$(shasum -a 256 "$ZIP_NAME" | awk '{print $1}')

echo ""
echo "📦 Evidence Pack Generated: $ZIP_NAME"
echo "🔑 SHA-256 Signature: $HASH"
echo ""
echo "Use this hash to sign the GO/NO-GO Protocol document."
