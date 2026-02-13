# Estrategia de Escalamiento e Infraestructura: CELLVI 2.0 (Hyper-Scale)

**Fecha:** 13/02/2026
**Autor:** Antigravity AI Agent
**Objetivo:** Preparar la plataforma para soportar 100,000+ activos conectados y millones de transacciones diarias.

## 1. Base de Datos (PostgreSQL + PostGIS)

### 1.1 Particionamiento de Tablas Masivas (Time-Series)
Actualmente, `vehicle_telemetry` y `cold_chain_logs` crecen indefinidamente.
*   **Problema:** Índices B-Tree se degradan con >10M filas. Consultas históricas lentas.
*   **Solución:** Implementar particionamiento declarativo por rango (RANGE partitioning) sobre la columna `ts` o `created_at`.
    *   `vehicle_telemetry_2026_01`
    *   `vehicle_telemetry_2026_02`
*   **Beneficio:** Queries recientes solo escanean la partición actual (Partition Pruning). Eliminación de datos antiguos instantánea (`DROP TABLE`).

### 1.2 Optimización Geoespacial (PostGIS)
*   **Hallazgo Crítico:** La columna `geofences.geom` no tiene índice GIST.
*   **Impacto:** El trigger `check_geofence_violations` realiza un escaneo secuencial completo por cada punto GPS recibido. O(N) complejidad.
*   **Solución:** `CREATE INDEX idx_geofences_geom ON public.geofences USING GIST (geom);`.
*   **Resultado:** Búsqueda espacial en O(log N).

### 1.3 Read Replicas (Futuro)
*   Para reportes pesados (`/reportes`), separar el tráfico de lectura del transaccional usando Supabase Read Replicas.

## 2. Backend (Edge Functions & API)

### 2.1 Caching de Estado Caliente (Redis/KV)
*   **Caso de Uso:** El mapa en vivo (`/dashboard`) consulta la última posición de cada vehículo cada 10-30s.
*   **Optimización:** No consultar la tabla `vehicle_telemetry` (millones de filas).
    *   Mantener una tabla "lite" `current_vehicle_positions` o usar Redis.
    *   Actualizar esta caché solo cuando llega un evento nuevo.
    *   El dashboard lee de la caché (in-memory speed).

### 2.2 Colas de Mensajes (Message Queues)
*   Para integraciones lentas (RNDC, Email, Webhooks de terceros), desacoplar la ejecución usando `pg_net` o una cola dedicada (Redis BullMQ / Amazon SQS) si el volumen crece.

## 3. Frontend (React/Vite)

### 3.1 Code Splitting Granular
*   Actualmente usamos `lazy` para rutas principales.
*   **Mejora:** Dividir `vendor` chunks más agresivamente para evitar descargas de 500kb+ iniciales.
*   **Tree Shaking:** Auditar dependencias (`lucide-react`, `@radix-ui`) para asegurar que solo se importan los iconos/componentes usados.

### 3.2 Optimización de Mapa
*   Usar `WebGL` para renderizado de flotas masivas (>1000 iconos) en lugar de marcadores DOM estándar (Leaflet Markers).
*   Implementar "Clustering" en el servidor (Supercluster) si la densidad de puntos es muy alta.

## 4. Observabilidad y SRE

### 4.1 Monitoreo Sintético
*   Implementar "Health Checks" automáticos que simulen un flujo crítico (Login -> Crear Orden -> Logout) cada 5 minutos.

### 4.2 Logging Estructurado
*   Centralizar logs de Edge Functions y Frontend en un servicio de agregación (Datadog / Logflare) para correlacionar errores con `trace_id`.

---
**Roadmap de Implementación:**
1.  [Inmediato] Crear índice GIST para Geocercas.
2.  [Corto Plazo] Optimizar Chunks de Vite.
3.  [Mediano Plazo] Implementar particionamiento de tablas telemétricas.
4.  [Largo Plazo] Migrar caché de última posición a Redis.
