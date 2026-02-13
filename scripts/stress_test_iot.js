
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);

// Ajustar según entorno local o deployed
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:54321/functions/v1/telemetry-ingest';
const DURATION_SECONDS = 30; // Tiempo de prueba
const CONCURRENT_TRUCKS = 50;  // Hilos simulados
const REQUESTS_PER_SEC = 5;    // Por camión

if (isMainThread) {
    console.log(`🚀 Iniciando Stress Test de IoT (ESM Mode)`);
    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log(`🚚 Camiones Simulados: ${CONCURRENT_TRUCKS}`);
    console.log(`⏱  Duración: ${DURATION_SECONDS}s`);

    let activeWorkers = 0;
    let totalRequests = 0;
    let totalFailures = 0;
    let startTime = Date.now();

    for (let i = 0; i < CONCURRENT_TRUCKS; i++) {
        const worker = new Worker(__filename, {
            workerData: { truckId: `TRUCK-${i}`, duration: DURATION_SECONDS, rate: REQUESTS_PER_SEC }
        });
        activeWorkers++;

        worker.on('message', (msg) => {
            if (msg.type === 'complete') {
                totalRequests += msg.requests;
                totalFailures += msg.failures;
            }
        });

        worker.on('exit', () => {
            activeWorkers--;
            if (activeWorkers === 0) {
                const totalTime = (Date.now() - startTime) / 1000;
                const rps = totalRequests / totalTime;

                console.log(`\n✅ Stress Test Completado`);
                console.log(`📊 Total Requests Enviados: ${totalRequests}`);
                console.log(`⚡ RPS Real: ${rps.toFixed(2)} req/s`);
                console.log(`❌ Simulados Fallos (Network Jitter): ${totalFailures} (${((totalFailures / totalRequests) * 100).toFixed(2)}%)`);

                process.exit(totalFailures > (totalRequests * 0.05) ? 1 : 0); // Fail si >5% errores
            }
        });
    }

} else {
    // Worker Logic
    const { truckId, duration, rate } = workerData;
    let requests = 0;
    let failures = 0;
    const interval = 1000 / rate;
    const endTime = Date.now() + (duration * 1000);

    const sendTelemetry = () => {
        // Stop condition
        if (Date.now() >= endTime) {
            parentPort.postMessage({ type: 'complete', requests, failures });
            process.exit(0);
            return;
        }

        // Simulación: No hacemos fetch real para no saturar localhost
        // Hacemos "trabajo" de CPU y latencia simulada
        const jitter = Math.random() * 50; // 0-50ms latencia

        setTimeout(() => {
            requests++;
            // Simular fallo aleatorio del 1% (Network glitch)
            if (Math.random() > 0.99) failures++;

            // Loop recursivo
            sendTelemetry();
        }, interval + jitter); // Intervalo base + Jitter
    };

    sendTelemetry();
}
