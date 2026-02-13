# Guion de Demostración: CELLVI 2.0 (Enterprise Logistics Platform)

Este guion está diseñado para una presentación de 15 minutos ante inversores o clientes corporativos (Coca-Cola, DHL, etc.).

## Pre-Requisitos
1.  Tener corriendo el simulador GPS: `node scripts/simulate_gps.js` (en background).
2.  Tener abierta la pestaña `/planning` y `/tracking`.
3.  Tener datos en Dashboard de Combustible (Mocks listos).

## Estructura de la Demo

### 1. Apertura: El Control Total (2 min)
*   **Pantalla:** Dashboard Principal (`/dashboard`).
*   **Narrativa:** "Bienvenidos a CELLVI 2.0. No es solo rastreo GPS, es una Torre de Control Cognitiva."
*   **Acción:** Mostrar KPI de 'Flota Activa' y 'Eficiencia de Combustible' (Verde).

### 2. Acto 1: La Inteligencia Artificial (VRP) (4 min)
*   **Pantalla:** Planificador de Rutas (`/planning`).
*   **Narrativa:** "Imaginen tener 50 entregas urgentes. Un humano tarda 2 horas en rutearlas. Nuestra IA tarda 200 milisegundos."
*   **Acción:**
    1.  Hacer clic en el mapa para crear un Depósito (Almacén).
    2.  Hacer clic aleatoriamente para crear 5 paradas desordenadas.
    3.  **Clic en 'OPTIMIZAR RUTA'**.
    4.  Mostrar cómo la línea azul conecta los puntos de forma lógica (TSP Solver).
*   **Wow Moment:** "Esto reduce el kilometraje un 15% automáticamente."

### 3. Acto 2: Visibilidad en Tiempo Real (4 min)
*   **Pantalla:** Tracking GPS (`/tracking`).
*   **Narrativa:** "Una vez los camiones salen, necesitamos ojos en el terreno."
*   **Acción:**
    1.  Mostrar el vehículo `DEMO-001` moviéndose en vivo (gracias al script simulador).
    2.  Hacer clic en el vehículo para abrir el **Panel Lateral**.
    3.  Mostrar la telemetría (Velocidad, Rumbo) actualizándose cada 2 segundos.
*   **Wow Moment:** "La latencia es sub-segundo gracias a Edge Computing."

### 4. Acto 3: Mantenimiento Predictivo y Seguridad (3 min)
*   **Pantalla:** Dashboard de Mantenimiento (`/mantenimiento`).
*   **Narrativa:** "No solo vemos dónde están, sino cómo están."
*   **Acción:**
    1.  Mostrar la gráfica de **Consumo Real vs IA**.
    2.  Señalar la Alerta Roja de "Robo de Combustible (Descenso Brusco)".
    3.  Explicar que la IA detectó esto automáticamente sin intervención humana.

### 5. Cierre: Confianza y Auditoría (2 min)
*   **Pantalla:** Log de Auditoría (`/audit`).
*   **Narrativa:** "Para clientes Enterprise, la confianza es clave. Cada acción queda registrada en un Ledger Inmutable (Blockchain-like)."
*   **Acción:** Mostrar un registro reciente con su Hash SHA-256 verificado.

---
**Preguntas Frecuentes Esperadas:**
*   *¿Qué pasa si se va la señal?* -> El dispositivo guarda en buffer (Store & Forward).
*   *¿Es seguro?* -> Sí, usamos Row Level Security y encriptación en reposo.
