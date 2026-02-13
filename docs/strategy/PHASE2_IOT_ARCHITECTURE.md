# Estrategia de Arquitectura Fase 2: IoT y Telemetría Masiva

**Objetivo:** Transformar CELLVI 2.0 en una plataforma de monitoreo en tiempo real, capaz de ingerir, procesar y visualizar la ubicación y estado de miles de vehículos simultáneamente.

## 1. El Desafío del Volumen (Big Data)
*   **Escenario:** 1,000 Vehículos x 1 reporte/10s = 8.6 Millones records/día.
*   **Problema:** Un `INSERT` fila por fila en Postgres mataría la base de datos en horas.
*   **Solución:**
    1.  **Ingesta Asíncrona:** Edge Function recibe JSON -> Pone en Cola (Redis/PG Queue) -> Worker inserta en Batch (COPY).
    2.  **Particionamiento:** Tabla `vehicle_telemetry` particionada por TIEMPO (semanal/mensual).
    3.  **Downsampling:** Guardar alta resolución por 24h, luego promediar (1 punto/minuto) para histórico.

## 2. Modelo de Datos Geoespacial
Usaremos **PostGIS** para cálculos precisos y **H3 (Uber Hexagonal Grid)** para análisis de densidad (Mapas de Calor).

### Esquema Propuesto (`vehicle_telemetry`)
*   `time`: TIMESTAMPTZ (Indexado, Clave de Partición).
*   `vehicle_id`: UUID.
*   `location`: GEOGRAPHY(Point).
*   `speed`: FLOAT.
*   `heading`: FLOAT (0-360).
*   `events`: JSONB (Aceleración brusca, Apertura de puerta).
*   `metadata`: JSONB (Batería, Señal, Satélites).

## 3. Flujo de Datos (Pipeline)
1.  **Dispositivo GPS/App:** Envía `POST /api/telemetry` (Compact JSON).
2.  **Edge Function:**
    *   Autentica (Token Liviano).
    *   Valida Schema.
    *   Escribe en `telemetry_buffer` (u `ingest_queue`).
3.  **Batch Worker:**
    *   Lee 1000 registros del buffer.
    *   Inserta en SQL (Bulk Insert).
    *   Actualiza "Última Ubicación" en tabla `vehicles` (Snapshot actual).
    *   Dispara alertas si detecta "Pánico" o "Geofence Breach".

## 4. Visualización
*   **Frontend:** Leaflet / Mapbox GL.
*   **Estrategia:** Websockets (Supabase Realtime) para la ubicación "en vivo" de vehículos activos, API REST para históricos.

## 5. Retención (Data Lifecycle)
*   **Hot Data (24h):** Acceso inmediato, resolución completa.
*   **Warm Data (30d):** Resolución media (1 min).
*   **Cold Data (>30d):** Archivado en S3 Parquet / Borrado.
