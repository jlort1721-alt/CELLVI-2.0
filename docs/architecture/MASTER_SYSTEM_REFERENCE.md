# MASTER SYSTEM REFERENCE (Arquitectura Definitiva V2.0)

**Clasificación:** Confidencial / Uso Interno
**Dueño Técnico:** Lead Architect (Antigravity)
**Última Actualización:** 2026-02-12

## 1. Topología del Sistema (C4 Model - Level 1)
CELLVI 2.0 es una plataforma distribuida **Event-Driven** centrada en datos geoespaciales.

### A. Capa de Frontend (SPA & PWA)
*   **Host:** Cloud CDN (Vercel/Netlify).
*   **Framework:** React 18 + Vite (SPA Routing).
*   **Offline Cache:** Service Workers (Workbox) + IndexedDB.
*   **Seguridad:** Content Security Policy (CSP) estricto.

### B. Capa de Backend (Database as a Service)
*   **Motor:** Supabase (PostgreSQL 15).
*   **Geoespacial:** PostGIS Extension habilitada.
*   **Autenticación:** GoTrue (JWT Tokens). Row Level Security (RLS) activo en TODAS las tablas.
*   **Realtime:** Websockets (CDC) para actualizaciones de flota < 500ms.

### C. Capa de Compute & AI (Edge Functions)
*   **Runtime:** Deno (V8 Isolate).
*   **Funciones:**
    *   `telemetry-ingest`: Ingesta masiva de GPS (Valida Schema Zod).
    *   `optimize-route`: Algoritmo VRP (2-Opt Heuristic) en TypeScript.
    *   `api-gateway`: Fachada pública con Rate Limiting (100 req/min).

---

## 2. Flujo de Datos Críticos

### A. Ingesta de Telemetría (Hot Path)
1.  **Dispositivo IoT** envía JSON a `telemetry-ingest` (HTTPS POST).
2.  **Edge Function** valida API Key del Tenant y Schema (Zod).
3.  **DB Writer** inserta en `vehicle_telemetry` (Time-Series Table).
4.  **Trigger** actualiza `vehicles.last_location` y `vehicles.status`.
5.  **Notificación Realtime** se dispara a navegadores conectados (`/tracking`).

### B. Optimización de Rutas (Compute Path)
1.  **Operador** selecciona 10-50 paradas en `/planning`.
2.  **Frontend** envía Payload a `optimize-route`.
3.  **Edge Function** ejecuta algoritmo VRP (TSP Solver) en memoria (< 200ms).
4.  **Respuesta** retorna array ordenado de coordenadas + distancia total.

---

## 3. Modelo de Seguridad (Zero Trust)
*   **Identidad:** Ningún acceso a DB sin JWT válido o Service Role Key (Server-Side).
*   **Aislamiento:** Un Tenant JAMÁS puede ver datos de otro (RLS Policy `tenant_id = auth.uid()`).
*   **Inmutabilidad:** La tabla `vehicle_telemetry` es WORM (Write Once, Read Many). `UPDATE` y `DELETE` bloqueados por Trigger.
*   **Auditoría:** Cada acción administrativa queda en `audit_logs` con Hash SHA-256.

## 4. Stack Tecnológico de Referencia
| Componente | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **UI** | React | 18.2 | Interfaz de Usuario |
| **State** | TanStack Query | v4 | Gestión de Estado Servidor |
| **Mapas** | Leaflet | 1.9 | Renderizado Geoespacial |
| **Charts** | Recharts | 2.12 | Visualización de Datos |
| **Testing** | Playwright | Latest | QA E2E Automatizado |
| **CI/CD** | GitHub Actions | v4 | Pipeline de Despliegue |

---

## 5. Escalabilidad (Capacity Planning)
*   **Base de Datos:** Particionamiento horizontal de `vehicle_telemetry` por mes (requiere Enterprise Plan en futuro).
*   **Edge Functions:** Auto-escalable por región (global).
*   **Storage:** Buckets S3-compatible para evidencias fotográficas (POD - Proof of Delivery).
