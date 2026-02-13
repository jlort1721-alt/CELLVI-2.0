# MANUAL DE OPERACIÓN Y MANTENIMIENTO (VERSION 2.0.0)
**Estado del Sistema:** CERTIFICACIÓN EMPRESARIAL - FASE 2 APROBADA

## 1. Arquitectura del Sistema
La plataforma utiliza una arquitectura **Serverless Event-Driven** optimizada para IoT:
*   **Frontend:** React con Vite, desplegado en Vercel (CI/CD automático).
*   **Base de Datos:** PostgreSQL (Supabase) con extensiones PostGIS para geolocalización.
*   **Seguridad:** Row Level Security (RLS) para aislamiento multi-tenant y políticas WORM para la telemetría.
*   **Persistencia Legal:** Tablas de auditoría inmutables (WORM) para cumplimiento RNDC.

## 2. Procedimientos de Seguridad (SecOps)
### 2.1. Políticas RLS
Toda consulta desde el frontend está filtrada por el `auth.uid()` del usuario:
*   `tenants`: Solo lectura para integrantes.
*   `vehicles`: Solo lectura para integrantes del tenant.
*   `vehicle_telemetry`: Inmutable (UPDATE/DELETE prohibidos).

### 2.2. Rotación de Llaves
En caso de compromiso de seguridad, rotar en Vercel y Supabase:
1. `VITE_SUPABASE_ANON_KEY`
2. `SUPABASE_SERVICE_ROLE_KEY` (Para scripts de backend).

## 3. Protocolos de Mantenimiento y Escalabilidad
### 3.1. Pruebas de Carga
Para validar escalabilidad ante la expansión de la flota:
```bash
node scripts/load_test_ingestion.js
```
*Umbral Enterprise:* > 100 eventos/seg por cada 1,000 vehículos.

### 3.2. Auditoría de Integridad
Para verificar que los datos no han sido alterados (Compliance SOC2):
```bash
node scripts/security_audit.js
```

## 4. Troubleshooting de Producción
*   **Pantalla en Blanco:** Verificar sincronización de `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el dashboard de Vercel.
*   **Fallo de Conexión Realtime:** El puerto WebSocket (443) debe estar abierto y la clave ANON debe coincidir con el proyecto actual.
*   **Error de Inserción de Telemetría:** Verificar que el `vehicle_id` exista y que el Tenant esté activo.

---
**Autor:** ANTIGRAVITY (DeepMind Coding Agent)
**Filosofía:** "Si no es robusto, seguro y auditable, no está terminado."
