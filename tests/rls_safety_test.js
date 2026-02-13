
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// ENV Loader manual si falla dotenv (igual que fire_test)
// ... (omitted for brevity, assume env loaded)

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ ERROR: Se requiere SUPABASE_SERVICE_ROLE_KEY para crear usuarios de prueba.");
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runRLSTests() {
    console.log("\n🛡️ === RLS MULTI-TENANT SECURITY GATE ===\n");

    const emailA = `tenant_a_${Date.now()}@test.com`;
    const emailB = `tenant_b_${Date.now()}@test.com`;
    const pass = "Test1234!";

    let tenantA_ID, tenantB_ID;
    let userA_ID, userB_ID;
    let vehicleA_ID;

    try {
        // 1. SETUP: Crear Tenants y Usuarios
        console.log("🛠️  Setup: Creando Tenants A y B...");

        // Crear Tenants (Service Role)
        const { data: tA } = await adminClient.from("tenants").insert({ name: "Tenant A Corp", nit: "900-A" }).select().single();
        const { data: tB } = await adminClient.from("tenants").insert({ name: "Tenant B Inc", nit: "900-B" }).select().single();
        tenantA_ID = tA.id;
        tenantB_ID = tB.id;

        // Crear Auth Users
        const { data: uA } = await adminClient.auth.admin.createUser({ email: emailA, password: pass, email_confirm: true, user_metadata: { tenant_id: tenantA_ID, role: 'admin' } });
        const { data: uB } = await adminClient.auth.admin.createUser({ email: emailB, password: pass, email_confirm: true, user_metadata: { tenant_id: tenantB_ID, role: 'admin' } });
        userA_ID = uA.user.id;
        userB_ID = uB.user.id;

        // Asignar user_roles (si la tabla existe)
        await adminClient.from("user_roles").insert([{ user_id: userA_ID, role: 'admin', tenant_id: tenantA_ID }, { user_id: userB_ID, role: 'admin', tenant_id: tenantB_ID }]);

        console.log("    ✅ Setup completado.");

        // 2. ACTION: User A crea recurso
        console.log("📝  Test 1: User A inserta Vehículo...");
        const clientA = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
        await clientA.auth.signInWithPassword({ email: emailA, password: pass });

        const { data: veh, error: errA } = await clientA.from("vehicles").insert({
            plate: "SEC-001",
            brand: "Toyota",
            tenant_id: tenantA_ID // RLS challenge: incluso si trata de poner tenant B, el trigger o policy debe forzar A o fallar.
        }).select().single();

        if (errA) throw new Error("User A no pudo crear vehículo: " + errA.message);
        vehicleA_ID = veh.id;
        console.log("    ✅ User A creó vehículo SEC-001.");

        // 3. ATTACK: User B intenta leer recurso de A
        console.log("🕵️‍♂️  Test 2: User B intenta leer Vehículo de A...");
        const clientB = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
        await clientB.auth.signInWithPassword({ email: emailB, password: pass });

        // Intento directo por ID
        const { data: stolenData, error: readError } = await clientB.from("vehicles").select("*").eq("id", vehicleA_ID);

        if (readError) {
            console.log("    ✅ Acceso denegado explícito (Error).");
        } else if (stolenData.length === 0) {
            console.log("    ✅ RLS Ejeuctado: Retornó 0 filas (Invisible).");
        } else {
            console.error("    ❌ FALLO CRÍTICO: User B pudo leer datos de User A!!!!");
            console.error("       Data leak:", stolenData);
            process.exit(1);
        }

        // 4. ATTACK: User B intenta modificar recurso de A
        console.log("🔨  Test 3: User B intenta borrar Vehículo de A...");
        const { error: delError, count } = await clientB.from("vehicles").delete().eq("id", vehicleA_ID).select(); // select para verificar retorno

        // Con RLS delete, si no ve la fila, often retorna count 0 y no error, lo cual es seguro.
        // O recibe error 404/403.
        // Verificamos si sigue existiendo con Admin.

        const { data: checkExistance } = await adminClient.from("vehicles").select("*").eq("id", vehicleA_ID);
        if (checkExistance.length === 1) {
            console.log("    ✅ RLS Ejecutado: Borrado falló (El recurso persiste).");
        } else {
            console.error("    ❌ FALLO CRÍTICO: User B pudo borrar datos de User A.");
            process.exit(1);
        }

        console.log("\n✅ RLS VERIFIED: ISOLATION IS ACTIVE.");

    } catch (e) {
        console.error("\n❌ SUITE FAILED:", e.message);
        process.exit(1);
    } finally {
        // Cleanup (borrar test users y tenants)
        if (tenantA_ID) await adminClient.from("tenants").delete().eq("id", tenantA_ID); // Cascade delete logic required in DB
        if (tenantB_ID) await adminClient.from("tenants").delete().eq("id", tenantB_ID);
        if (userA_ID) await adminClient.auth.admin.deleteUser(userA_ID);
        if (userB_ID) await adminClient.auth.admin.deleteUser(userB_ID);
        console.log("🧹  Cleanup done.");
    }
}

runRLSTests();
