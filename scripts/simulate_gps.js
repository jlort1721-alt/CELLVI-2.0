
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// 1. CARGA DE VARIABLES (Prioridad: ENV Shell -> .env -> .env.local)
const loadEnv = (path) => {
    if (fs.existsSync(path)) {
        const envConfig = fs.readFileSync(path, "utf-8");
        envConfig.split("\n").forEach((line) => {
            const [key, val] = line.split("=");
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim();
            }
        });
    }
};

loadEnv(".env");
loadEnv(".env.local");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || (!ANON_KEY && !SERVICE_KEY)) {
    console.error("❌ ERROR: No se encontraron credenciales en .env");
    console.error("   - Se requiere VITE_SUPABASE_URL");
    console.error("   - Se requiere VITE_SUPABASE_ANON_KEY (mínimo) o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

// Preferir Service Key para script de administrador, si no Anon Key
const CLIENT_KEY = SERVICE_KEY || ANON_KEY;
const supabase = createClient(SUPABASE_URL, CLIENT_KEY);

console.log(`✅ Cliente Supabase inicializado con: ${SERVICE_KEY ? 'SERVICE_ROLE (Admin)' : 'ANON_KEY (Public)'}`);

// 2. CONFIGURACIÓN DE RUTA (Bogotá)
const ROUTE_START = { lat: 4.6097, lng: -74.0817 };
const ROUTE_END = { lat: 4.6980, lng: -74.1420 };
const PLATE = "DEMO-001";
const STEPS = 100;

// 3. UTILIDADES
async function getOrCreateVehicle() {
    // Intentar buscar
    let { data: vehicle } = await supabase.from("vehicles").select("id").eq("plate", PLATE).maybeSingle();

    if (vehicle) return vehicle.id;

    // Si no tenemos Service Key, no podemos crear (probablemente bloqueado por RLS anon)
    if (!SERVICE_KEY) {
        console.warn("⚠️ Advertencia: No hay Service Role Key. Si el vehículo no existe, la creación podría fallar por RLS.");
    }

    console.log(`🛠 Creando vehículo '${PLATE}'...`);

    // Obtener un tenant (cualquiera)
    let { data: tenant } = await supabase.from("tenants").select("id").limit(1).maybeSingle();

    if (!tenant && SERVICE_KEY) {
        // Crear tenant si somos admin
        const { data: newTenant } = await supabase.from("tenants").insert({ name: "Demo Logistics", slug: "demo" }).select().single();
        tenant = newTenant;
    }

    if (!tenant) {
        console.error("❌ Error: No se encontró Tenant y no se puede crear (Falta permisos).");
        return null;
    }

    const payload = {
        plate: PLATE,
        internal_code: "SIM-01",
        status: "activo",
        tenant_id: tenant.id
    };

    const { data: newVehicle, error } = await supabase.from("vehicles").insert(payload).select().single();

    if (error) {
        console.error("❌ Error creando vehículo:", error.message);
        return null; // Quizás el usuario no tiene permisos de inserción
    }
    return newVehicle.id;
}

function interpolate(start, end, progress) {
    return start + (end - start) * progress;
}

// 4. BUCLE DE SIMULACIÓN
async function run() {
    const vehicleId = await getOrCreateVehicle();
    if (!vehicleId) {
        console.error("❌ Deteniendo simulación: Vehículo no disponible.");
        return;
    }

    console.log(`🚀 Iniciando GPS para ${PLATE} (${vehicleId})`);

    let progress = 0;
    let useDirectInsert = false;

    // Detectar si estamos en localhost para Edge Functions
    const isLocal = SUPABASE_URL.includes("localhost") || SUPABASE_URL.includes("127.0.0.1");
    // URL LOCAL Default de Supabase CLI
    const functionUrl = isLocal
        ? "http://127.0.0.1:54321/functions/v1/telemetry-ingest"
        : `${SUPABASE_URL}/functions/v1/telemetry-ingest`;

    setInterval(async () => {
        progress += 0.01;
        if (progress > 1) progress = 0;

        const lat = interpolate(ROUTE_START.lat, ROUTE_END.lat, progress);
        const lng = interpolate(ROUTE_START.lng, ROUTE_END.lng, progress);

        // Simular datos
        const payload = {
            vehicle_id: vehicleId,
            lat: lat + (Math.random() - 0.5) * 0.0005,
            lng: lng + (Math.random() - 0.5) * 0.0005,
            speed: 40 + Math.random() * 20,
            heading: 290,
            metadata: { bat: 95, sim: true }
        };

        // ESTRATEGIA: Intentar Edge Function -> Fallback SQL Directo
        if (!useDirectInsert) {
            try {
                // Usamos fetch directo para control total de URL
                const res = await fetch(functionUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${CLIENT_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    process.stdout.write(`\r📡 [Edge] Lat: ${payload.lat.toFixed(4)} Lng: ${payload.lng.toFixed(4)}  `);
                    return;
                } else {
                    // Si es 404 (Función no existe) o 500
                    if (res.status === 404 || res.status === 500) {
                        console.warn(`\n⚠️ Edge Function no responde (${res.status}). Cambiando a SQL Directo.`);
                        useDirectInsert = true;
                    }
                }
            } catch (e) {
                console.warn(`\n⚠️ Error conexión Edge Function: ${e.message}. Cambiando a SQL Directo.`);
                useDirectInsert = true;
            }
        }

        if (useDirectInsert) {
            // Verificar que tenemos service key para escribir directo (o policy anon abierta)
            if (!SERVICE_KEY) {
                console.error("\n❌ Falló Edge Function y no hay SERVICE_KEY para inserción directa SQL.");
                console.log("   -> Solución: Agrega SUPABASE_SERVICE_ROLE_KEY al .env O despliega la función telemetry-ingest.");
                process.exit(1);
            }

            const { error } = await supabase.from("vehicle_telemetry").insert({
                vehicle_id: payload.vehicle_id,
                time: new Date().toISOString(),
                latitude: payload.lat,
                longitude: payload.lng,
                speed: payload.speed,
                heading: payload.heading,
                metadata: payload.metadata
            });

            if (error) console.error("\n❌ SQL Error:", error.message);
            else process.stdout.write(`\r💾 [SQL]  Lat: ${payload.lat.toFixed(4)} Lng: ${payload.lng.toFixed(4)}  `);
        }

    }, 2000);
}

run();
