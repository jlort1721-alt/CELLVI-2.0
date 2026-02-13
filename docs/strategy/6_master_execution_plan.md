# CELLVI 2.0 — Plan Maestro de Ejecución Arquitectónica
**Estado:** CONFIDENCIAL | **Versión:** 1.0 (Final) | **Fecha:** 2026-02-12

Este documento consolida la visión técnica, operativa y de negocio para la construcción de CELLVI 2.0. Actúa como la fuente única de verdad para ingeniería, producto y operaciones.

---

## A. Mapa de Integración (The Cleanup)

**Diagnóstico:** El sistema actual tiene riesgos de duplicidad en gestión documental y alertas.
**Decisión:** Centralizar "Core" y tratar todo lo demás como consumidor.

| Función | Estado Actual / Riesgo | Estrategia de Unificación (Decisión) |
| :--- | :--- | :--- |
| **Documentos** | Dispersos en Hoja de Vida (Vehículo/Cond) vs. PESV vs. Contratos FUEC. | **Unificar en `compliance_documents`**. Todo (SOAT, Licencia, Contrato) es un registro en esta tabla con `category` + `expiry_date`. |
| **Alertas** | Alertas GPS vs. Vencimientos vs. Mantenimiento. | **Motor Único de Reglas**. Un vencimiento es simplemente una regla de tiempo (`if now > expiry`). Todas van a la tabla `alerts`. |
| **Auditoría** | Logs de sistema vs. Truth Layer (Evidencia). | **Separación Clara**. `audit_logs` para "quién hizo clic" (admin). `evidence_records` para "qué pasó en el mundo físico" (inmutable). |
| **RNDC/RUNT** | Integraciones aisladas ("islas"). | **Bus de Eventos**. RNDC no se "llama"; RNDC "escucha" el evento `trip.completed` y actúa asíncronamente. |

---

## B. Arquitectura: El Monolito Modular (Modular Monolith)

No empezaremos con microservicios (complejidad innecesaria). Usaremos un **Monolito Modular** sobre Supabase (Postgres), donde los límites son lógicos (schemas/modulos), no físicos.

### Decisiones Clave & Trade-offs
1.  **Lógica en BD (Postgres) vs. App (Node/Ts):**
    *   *Decisión:* **Híbrida**. Integridad de datos y RLS (seguridad) en Postgres. Lógica de negocio compleja (RNDC SOAP, PDF generation) en Edge Functions (TypeScript).
    *   *Riesgo:* Vendor lock-in con Supabase. *Mitigación:* Usar Docker local para desarrollo, manteniendo portabilidad de Postgres.
2.  **Cola de Mensajes:**
    *   *Decisión:* **Postgres como Cola (pg_mq)** para iniciar. Simple, transaccional.
    *   *Escalamiento:* Migrar a Redis/Kafka solo cuando superemos 10k eventos/seg.
3.  **Offline-First:**
    *   *Decisión:* **RxDB o WatermelonDB** en móvil. Sincronización delta.

### Diagrama de Alto Nivel

```mermaid
graph TD
    subgraph "Clientes (Frontend)"
        WebApp[React Admin Panel]
        MobileApp[React Native Driver App]
        PWA[Offline Preoperacional]
    end

    subgraph "Edge Layer (CDN + Compute)"
        LB[Load Balancer]
        WAF[WAF / DDoS Protection]
        EdgeFn[Supabase Edge Functions\n(Business Logic / Integrations)]
    end

    subgraph "Core Data (Modular Monolith)"
        DB[(Postgres Primary)]
        
        subgraph "Modules (Schemas)"
            M_Auth[Auth & RBAC]
            M_Fleet[Fleet & Assets]
            M_Ops[Operations & Trips]
            M_Comp[Compliance (RNDC/PESV)]
            M_IoT[IoT Ingestion & Rules]
        end
        
        MsgQueue[PgMQ Job Queue]
    end

    subgraph "External World"
        RNDC[MinTransporte RNDC]
        RUNT[RUNT HQ / API]
        GPS[GPS Trackers (TCP/UDP)]
    end

    WebApp --> LB
    MobileApp --> LB
    GPS --> EdgeFn
    EdgeFn --> DB
    MsgQueue --> EdgeFn
    EdgeFn --> RNDC
    EdgeFn --> RUNT
```

---

## C. Dominios (Bounded Contexts)

| Dominio | Responsabilidad Única | Eventos Clave (Event Bus) |
| :--- | :--- | :--- |
| **IAM (Identity)** | Quién es quién y qué puede hacer (Tenants, Users, RBAC). | `user.created`, `tenant.suspended` |
| **Fleet (Assets)** | La "Hoja de Vida" digital (Vehículos, Conductores, Docs). | `vehicle.status_changed`, `doc.expiring`, `driver.banned` |
| **Tracking (IoT)** | Dónde están y qué hacen (Posición, Telemetría, Reglas). | `telemetry.received`, `geofence.enter`, `rule.triggered` |
| **Ops (Viajes)** | El negocio: Mover carga de A a B (Manifiestos, Remesas). | `trip.created`, `trip.started`, `trip.completed`, `pod.signed` |
| **Mantenimiento** | Cuidar los activos (Preventivo, Correctivo). | `maint.due`, `work_order.closed` |
| **Legal (Gov)** | Cumplir la ley (RNDC, FUEC, PESV). | `rndc.manifest_sent`, `fuec.generated` |

---

## D. Modelo de Datos Mínimo (Refinamiento)

Aprovechando las migraciones existentes, definimos la estrategia física:

1.  **Particionamiento:**
    *   `telemetry_events`: Particionar por `ts` (mensual) y `tenant_id` (list). Esto es CRÍTICO para performance y borrado histórico.
2.  **Índices Geoespaciales:**
    *   Índice GIST en `last_position` (Vehículos) y `coordinates` (Geocercas).
3.  **Auditoría Forense:**
    *   Tablas `_history` o `audit_logs` separadas. No ensuciar la tabla principal. Usar triggers para snapshots `OLD` -> `NEW`.

**ERD Textual (Núcleo Crítico):**
*   `Tenant` (1) <-> (N) `Vehicle`
*   `Vehicle` (1) <-> (1) `Device` (Actual)
*   `Vehicle` (1) <-> (N) `Trip`
*   `Trip` (1) <-> (N) `TripEvent` (Carga, Descarga, Parada)
*   `Trip` (1) <-> (1) `RNDC_Record` (Estado de integración)
*   `Trip` (1) <-> (1) `FUEC_Contract` (Si es transporte especial)

---

## E. Flujos Integrados (Business Processes)

### 1. Salida a Operación (El "Golden Path")
1.  **Solicitud:** Cliente crea `Trip` (Origen, Destino, Carga).
2.  **Validación Automática (Hard Stop):** Sistema verifica:
    *   ¿Vehículo Activo? ¿SOAT/Tecno vigente?
    *   ¿Conductor habilitado? ¿Seguridad Social al día?
    *   ¿Preoperacional del día realizado? (Si no -> Bloqueo).
3.  **Asignación:** Se notifica al conductor (App).
4.  **Ejecución:** Conductor hace Check-in -> Preoperacional (si falta) -> Inicia Viaje.
5.  **Gobierno:** Sistema dispara asíncronamente a RNDC (Generar Manifiesto).

### 2. Ciclo de Mantenimiento
1.  **Gatillo:** Odómetro virtual llega a umbral (ej. 5000km desde último cambio).
2.  **Alerta:** Se crea registro en `Alerts` ("Mantenimiento Próximo").
3.  **Acción:** Jefe de Flota convierte Alerta en `WorkOrder`.
4.  **Ejecución:** Mecánico registra cambios -> Cierra OT.
5.  **Cierre:** Sistema actualiza `last_maintenance_km` y reinicia contador.

---

## F. Contratos API (Especificación Táctica)

Estructura REST estándar: `/api/v1/{tenant_slug}/{module}/{resource}`.

**Módulo Operaciones (`/ops`)**
*   `POST /trips`: Crear viaje.
    *   *Payload:* `{ "vehicle_id": "uuid", "driver_id": "uuid", "route": { "origin": "lat,lng", "dest": "lat,lng" }, "cargo": {...} }`
*   `POST /trips/{id}/advance`: Registrar hito (Cargue, Descargue).
    *   *Payload:* `{ "status": "loading", "evidence_photos": ["url1"], "location": "lat,lng" }`

**Módulo Gobierno (`/gov`)**
*   `POST /rndc/transmit`: Forzar transmisión manual.
    *   *Payload:* `{ "trip_id": "uuid", "type": "manifiesto" }`

**Módulo Devices (`/iot`)**
*   `POST /commands/send`: Enviar comando (apagar motor).
    *   *Payload:* `{ "device_id": "uuid", "command": "ENGINE_STOP", "reason": "Theft protocol" }`

---

## G. App Móvil & Estrategia Offline

**Tecnología:** React Native + WatermelonDB (SQLite local).

**Estrategia "Sync-First":**
1.  **Estado Local:** La app *jamás* lee directo de la API para mostrar datos. Lee de su DB local.
2.  **Sincronización:** Worker en segundo plano (cada 5 min o push notification) baja deltas (`since_last_sync`).
3.  **Conflicto:** "Server wins" para configuración. "Client wins" para evidencia de campo (fotos tomadas in-situ).
4.  **Cifrado:** DB local cifrada con SQLCipher. Clave derivada del login del usuario.

**UX de Campo (Operación Sin Señal):**
*   Conductor completa preoperacional en túnel.
*   App guarda foto y firma con timestamp local.
*   Cola de "Pending Uploads" visible al usuario.
*   Al recuperar red -> Sube fotos -> Obtiene OK del servidor -> Borra local.

---

## H. Integraciones Robustas

### 1. RNDC (MinTransporte) - La Pesadilla
*   **Problema:** SOAP XML, lento, frecuentemente caído.
*   **Solución:** "Queue & Retry Pattern".
    *   App nunca espera a RNDC. App guarda "Encolado".
    *   Worker toma trabajo -> Transforma a XML -> Firma -> Envía.
    *   Si fallo 5xx/Timeout -> Reintento exponencial (1m, 5m, 1h).
    *   Si fallo 4xx (Validación) -> Marca "Error de Datos" -> Alerta a Jefe de Tráfico.
    *   **Idempotencia:** Hash del payload XML para no enviar doble remesa.

### 2. RUNT (Registro Nacional)
*   **Adapter:** Middleware que normaliza RUNT Legacy (Scraping/SOAP) y RUNT PRO (API nueva) en una sola interfaz interna `ICarRegistry`.

### 3. FUEC (Transporte Especial)
*   **Modo Local:** Generación de PDF firmado digitalmente (QR verificable contra nuestra API pública `cellvi.com/verify-fuec`). No depende de servidor central de MinTransporte (aún).
*   **Modo Conectado:** Cuando habiliten servicio web, se conecta al bus de eventos.

---

## I. Dashboards (Inteligencia, no solo datos)

**Estrategia:** Filtros globales de Tenant + RLS.

1.  **Torre de Control (Tiempo Real):**
    *   Mapa Clusterizado.
    *   Lista de "Excepciones" (no lista de todos los carros, solo los que tienen problemas/retrasos).
2.  **Gerencia (Tendencias):**
    *   Costo por KM.
    *   Utilización de Flota (Días parado vs en viaje).
    *   Huella de Carbono (Estimada por combustible).
3.  **Mantenimiento:**
    *   Semáforo de vencimientos (Rojo < 7 días, Amarillo < 30 días).

---

## J. Plan de Pruebas (QA Strategy)

**Niveles:**
1.  **Unit:** Lógica de negocio (Cálculo de tarifas, Reglas de validación FUEC). Vitest.
2.  **Integration:** Flujo completo de API (Crear Viaje -> Verificar DB).
3.  **E2E:** Playwright simulando Operador Web y App Móvil.

**"Pruebas de Fuego" (Drills):**
*   **Chaos Monkey RNDC:** Simular caída del servicio RNDC por 4 horas. Verificar que la cola procesa al volver.
*   **The "Time Travel":** Adelantar reloj del servidor para verificar expiración masiva de documentos y bloqueo de flota.
*   **Offline Attack:** Poner dispositivo móvil en modo avión, realizar 50 transacciones, matar la app, volver a abrir, conectar red. Verificar integridad.

---

## K. Seguridad (Hardening)

1.  **Threat Model:**
    *   *Riesgo:* Conductor malicioso intenta falsificar posición GPS (Mock Locations).
    *   *Defensa:* App detecta `isMockProvider` de Android. Servidor correlaciona con antenas celulares (Network triangulation) si es posible.
2.  **Datos:**
    *   Cifrado columnas sensibles (PII de conductores) con pg_crypto.
    *   URLs de evidencias (fotos) firmadas temporalmente (Signed URLs bucket), no públicas.
3.  **Infra:**
    *   VPC Peering para base de datos.
    *   Rate Limiting estricto por Tenant.

---

## L. Backlog Priorizado (Roadmap de Ejecución)

### FASE 1: MVP - "Control Total" (Días 1-90)
*   **Core:** Tenant isolation, gestión de usuarios, gestión de vehículos.
*   **IoT:** Ingesta Teltonika básica, última posición, historial.
*   **Docs:** Módulo Compliance básico (Vencimientos + Alertas).
*   **App:** Preoperacional básico (sin offline complejo).

### FASE 2: V1 - "Operación Integrada" (Días 91-180)
*   **Ops:** Módulo de Viajes y Despachos.
*   **Gov:** Integración RNDC (Ida). Generador FUEC PDF.
*   **App:** Offline robusto, Chat operativo.
*   **IoT:** Reglas complejas (Geocercas, Excesos) en tiempo real.

### FASE 3: V2 - "Ecosistema & IA" (Días 181-360)
*   **IA:** Chat con tus datos ("¿Qué carros vencen soat mañana?").
*   **Gov:** Integración RNDC (Vuelta/Cumplidos). Interfaz RUNT.
*   **Financiero:** Liquidación de conductores, rentabilidad por viaje.
*   **Integración:** Webhooks salientes para clientes (SAP/Oracle).

---

### Siguientes Pasos Inmediatos
1.  Implementar la **Ingestión IoT** (Edge Function vs. Go service).
2.  Construir el **Dashboard de Torre de Control** (Frontend).
3.  Desarrollar la **App Móvil de Conductor** (Skeleton).

**Matriz RACI (Resumida):**
*   **Desarrollo:** Responsible (Construir features).
*   **Arquitectura:** Accountable (Calidad y escalabilidad).
*   **Operaciones:** Consulted (Definir reglas de negocio RNDC).
*   **Gerencia:** Informed (Progreso de KPIs).
