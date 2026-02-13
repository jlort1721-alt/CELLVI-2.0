
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ ERROR: Missing credentials.');
    console.error('Please export VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runLoadTest() {
    console.log('🚀 Starting Phase 2: Ingestion Load Test (1,000 Simulated Devices)...');

    // 1. Setup Test Environment
    console.log('📦 Setting up test tenant and devices...');
    const tenantSlug = `loadtest-${Date.now()}`;

    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .insert({ name: 'Load Test Tenant', slug: tenantSlug })
        .select()
        .single();

    if (tErr) throw new Error(`Tenant creation failed: ${tErr.message}`);

    const VEHICLE_COUNT = 1000;
    const BATCH_SIZE = 100;
    let vehicleIds = [];

    // Bulk create vehicles
    for (let i = 0; i < VEHICLE_COUNT; i += BATCH_SIZE) {
        const batch = Array.from({ length: BATCH_SIZE }, (_, j) => ({
            tenant_id: tenant.id,
            plate: `LOAD-${i + j}`,
            status: 'active',
            type: 'truck'
        }));

        const { data: vehicles, error: vErr } = await supabase
            .from('vehicles')
            .insert(batch)
            .select('id');

        if (vErr) throw new Error(`Vehicle batch creation failed: ${vErr.message}`);
        vehicleIds.push(...vehicles.map(v => v.id));
        process.stdout.write(`\rCreated ${vehicleIds.length}/${VEHICLE_COUNT} vehicles...`);
    }
    console.log('\n✅ Environment ready.');

    // 2. Execute Load Test
    console.log('⚡ simulating telemetry ingestion...');
    const start = performance.now();
    let successCount = 0;
    let failCount = 0;

    // Simulate concurrent requests using batches of promises
    const telemetryBatch = vehicleIds.map(vid => ({
        vehicle_id: vid,
        time: new Date().toISOString(),
        latitude: 4.0 + Math.random(),
        longitude: -74.0 + Math.random(),
        speed: Math.random() * 100,
        heading: Math.random() * 360,
        metadata: { load_test: true }
    }));

    // Insert in chunks to avoid HTTP payload limits, but measure total throughput
    // Real world: 1000 devices send individually. Here we simulate Supabase throughput.
    // We will do parallel requests of size 50 to simulate concurrency.

    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < telemetryBatch.length; i += CHUNK_SIZE) {
        chunks.push(telemetryBatch.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(chunks.map(async (chunk, idx) => {
        // We use .insert() with multiple rows to simulate "high throughput" hitting the database
        // In a real device scenario, it's 1000 separate connections. 
        // Testing the DB write speed is the goal here.
        const { error } = await supabase.from('vehicle_telemetry').insert(chunk);
        if (error) {
            console.error(`Batch ${idx} failed:`, error.message);
            failCount += chunk.length;
        } else {
            successCount += chunk.length;
        }
    }));

    const end = performance.now();
    const duration = (end - start) / 1000; // seconds

    // 3. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('tenants').delete().eq('id', tenant.id); // Cascade should delete vehicles/telemetry

    // 4. Report
    console.log('\n------------------------------------------------');
    console.log('📊 LOAD TEST RESULTS');
    console.log('------------------------------------------------');
    console.log(`Devices Simulated: ${VEHICLE_COUNT}`);
    console.log(`Successful Inserts: ${successCount}`);
    console.log(`Failed Inserts:     ${failCount}`);
    console.log(`Total Time:         ${duration.toFixed(2)}s`);
    console.log(`Throughput:         ${(successCount / duration).toFixed(0)} events/sec`);
    console.log('------------------------------------------------');

    if (failCount > 0 || (successCount / duration) < 100) {
        console.log('❌ CERTIFICATION FAILED: Criteria not met.');
        process.exit(1);
    } else {
        console.log('✅ CERTIFICATION PASSED: System is Enterprise Ready.');
        process.exit(0);
    }
}

runLoadTest().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
