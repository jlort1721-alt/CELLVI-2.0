
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// --- ENV LOADER ---
try {
    if (fs.existsSync(".env")) {
        const envConfig = fs.readFileSync(".env", "utf-8");
        envConfig.split("\n").forEach((line) => {
            // Ignorar comentarios
            if (line.startsWith("#")) return;
            const parts = line.split("=");
            if (parts.length >= 2) {
                const key = parts[0].trim();
                // Unir el resto por si el valor tiene =
                const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
                process.env[key] = val;
            }
        });
    }
} catch (e) {
    console.warn("⚠️ No se pudo cargar .env local:", e.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR CRÍTICO: Variables de entorno faltantes.");
    console.error("   Debes tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env");
    process.exit(1);
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFireTests() {
    console.log("\n🔥 === PRUEBAS DE FUEGO CELLVI 2.0 (AUTOMATIZADAS) ===\n");
    console.log(`📡 Conectando a Supabase: ${supabaseUrl}`);

    let checksPassed = 0;
    let checksTotal = 3;

    // --- TEST A: INTEGRITY OF AUDIT LOGS ---
    console.log("\n🕵️‍♂️  [TEST A] Verificando Auditoría Forense (audit_logs)...");
    try {
        const { count, error } = await supabase
            .from("audit_logs")
            .select("*", { count: "exact", head: true });

        if (error) {
            // Code 42P01 means 'undefined table' in Postgres
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                console.error("    ❌ FALLO CRÍTICO: La tabla 'audit_logs' no existe.");
                console.error("       -> ACCION: Ejecuta la migración SQL '20260212200000_phase3_audit_and_queues.sql'.");
            } else {
                console.error("    ❌ Error de acceso:", error.message, error.code);
            }
        } else {
            console.log(`    ✅ TABLA AUDIT_LOGS EXISTE. Registros: ${count}`);
            checksPassed++;
        }
    } catch (err) {
        console.error("    ❌ Excepción:", err.message);
    }

    // --- TEST B: ASYNC QUEUE ---
    console.log("\n⚡️  [TEST B] Verificando Cola de Integración (integration_jobs)...");
    try {
        const { data, error } = await supabase
            .from("integration_jobs")
            .insert({
                type: "FIRE_TEST_JOB",
                payload: { source: "script", ts: Date.now() },
                status: "queued"
            })
            .select()
            .single();

        if (error) {
            console.error("    ❌ FALLO CRÍTICO: Error al encolar trabajo.", error.message);
            if (error.code === '42P01' || error.message.includes('does not exist')) console.error("       -> Causa: Tabla 'integration_jobs' no encontrada.");
        } else {
            console.log(`    ✅ TRABAJO ENCOLADO. ID: ${data.id} | Status: ${data.status}`);
            checksPassed++;
        }
    } catch (err) {
        console.error("    ❌ Excepción:", err.message);
    }

    // --- TEST C: SECRET MANAGEMENT (Schema) ---
    console.log("\n🔐  [TEST C] Verificando Bóveda de Credenciales (tenant_credentials)...");
    try {
        const { count, error } = await supabase.from("tenant_credentials").select("*", { count: "exact", head: true });

        if (error && error.code !== '42501') { // 42501 permission denied is OK (RLS active)
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                console.error("    ❌ FALLO: Tabla 'tenant_credentials' no existe.");
            } else {
                console.error("    ⚠️  Error:", error.message);
            }
        } else {
            console.log("    ✅ TABLA CREDENCIALES EXISTE (Protegida).");
            checksPassed++;
        }
    } catch (err) {
        console.error("    ❌ Excepción:", err.message);
    }

    console.log("\n==================================================");

    if (checksPassed < checksTotal) {
        console.log(`⚠️  ALERTA: Solo pasaron ${checksPassed}/${checksTotal} pruebas.`);
        console.log("   Esto indica que las migraciones de Base de Datos NO se han aplicado.");
        console.log("   Por favor ejecuta: npx supabase db push");
        process.exit(1);
    } else {
        console.log("✅ RESULTADO: INFRAESTRUCTURA VERIFICADA Y LISTA.");
        process.exit(0);
    }
}

runFireTests();
