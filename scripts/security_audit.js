
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('❌ ERROR: Missing credentials.');
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

async function runSecurityAudit() {
    console.log('🛡️ Starting Phase 2: Security & Penetration Audit...');

    const auditResults = [];

    // 1. WORM Compliance (Immutability)
    console.log('\n🔍 Testing Telemetry Immutability (WORM Policies)...');
    try {
        // Setup temporary vehicle for audit
        const { data: tenant } = await adminClient.from('tenants').select('id').limit(1).single();
        const { data: vehicle, error: vErr } = await adminClient
            .from('vehicles')
            .insert({ plate: `AUDIT-${Date.now()}`, tenant_id: tenant.id })
            .select()
            .single();

        if (vErr) throw new Error(`Vehicle setup failed: ${vErr.message}`);

        // Insert a master record
        const { data: telemetry, error: iErr } = await adminClient
            .from('vehicle_telemetry')
            .insert({
                time: new Date().toISOString(),
                vehicle_id: vehicle.id,
                latitude: 4.6,
                longitude: -74.0,
                metadata: { audit: true }
            })
            .select()
            .single();

        if (iErr) throw new Error(`Telemetry insert failed: ${iErr.message}`);

        // Attempt UPDATE (Should fail by trigger/policy)
        const { error: uErr } = await adminClient
            .from('vehicle_telemetry')
            .update({ latitude: 5.0 })
            .eq('time', telemetry.time)
            .eq('vehicle_id', telemetry.vehicle_id);

        const updateBlocked = uErr && (uErr.message.includes('Telemetry is immutable') || uErr.message.includes('permission denied'));
        if (updateBlocked) {
            console.log(`✅ UPDATE: Blocked correctly (${uErr.message.includes('permission denied') ? 'Permissions' : 'Trigger'}).`);
        } else {
            console.log('❌ UPDATE: Bypass detected or unexpected error!');
            if (uErr) console.log('Error was:', uErr.message);
            else console.log('Update succeeded (ERROR: Should have been blocked)');
        }
        auditResults.push({ test: 'WORM Update', passed: updateBlocked });

        // Attempt DELETE (Should fail)
        const { error: dErr } = await adminClient
            .from('vehicle_telemetry')
            .delete()
            .eq('time', telemetry.time)
            .eq('vehicle_id', telemetry.vehicle_id);

        const deleteBlocked = dErr && (dErr.message.includes('Telemetry is immutable') || dErr.message.includes('permission denied'));
        if (deleteBlocked) {
            console.log(`✅ DELETE: Blocked correctly (${dErr.message.includes('permission denied') ? 'Permissions' : 'Trigger'}).`);
        } else {
            console.log('❌ DELETE: Bypass detected or unexpected error!');
            if (dErr) console.log('Error was:', dErr.message);
            else console.log('Delete succeeded (ERROR: Should have been blocked)');
        }
        auditResults.push({ test: 'WORM Delete', passed: deleteBlocked });

    } catch (err) {
        console.error('WORM Test Error:', err.message);
    }

    // 2. RLS Tenant Isolation
    console.log('\n🔍 Testing Tenant Isolation (RLS Policies)...');
    try {
        // Anonymous request (without session/valid JWT pointing to tenant)
        const { data: vehicles, error: rlsErr } = await anonClient
            .from('vehicles')
            .select('*');

        // Expected: 0 rows because of RLS (unless public read is on, which should be off)
        const isolated = vehicles && vehicles.length === 0;
        console.log(isolated ? '✅ RLS: Tenant isolation active (0 rows for anon).' : '❌ RLS: Data leakage detected!');
        auditResults.push({ test: 'Tenant Isolation', passed: isolated });

    } catch (err) {
        console.error('RLS Test Error:', err.message);
    }

    // 3. Final Report
    console.log('\n------------------------------------------------');
    console.log('🛡️ SECURITY AUDIT REPORT');
    console.log('------------------------------------------------');
    let allPassed = true;
    auditResults.forEach(r => {
        console.log(`${r.passed ? '✅' : '❌'} ${r.test.padEnd(25)}: ${r.passed ? 'PASSED' : 'FAILED'}`);
        if (!r.passed) allPassed = false;
    });
    console.log('------------------------------------------------');

    process.exit(allPassed ? 0 : 1);
}

runSecurityAudit().catch(err => {
    console.error('Fatal Audit Error:', err);
    process.exit(1);
});
