# Arquitectura Cloud - CELLVI 2.0
**Autor:** Arquitecto Cloud Senior
**Fecha:** Febrero 2026
**Versión:** 1.0

Este documento define la arquitectura técnica para soportar la ingesta masiva de telemetría, procesamiento en tiempo real y almacenamiento seguro de **ASEGURAR LTDA**.

## 1. Requerimientos de Alto Nivel
*   **Eventos:** Soporte para picos de **10,000 eventos/segundo**.
*   **Latencia:** Objetivo de visualización en mapa: **< 500ms** (end-to-end).
*   **Regiones:** Multi-región activo-pasivo (Primaria: us-east-1, DR: us-west-2) para continuidad de negocio.
*   **Storage:** Estrategia híbrida (Time-series para telemetría, Relacional para negocio, Object para evidencia).

---

## 2. Diagrama de Arquitectura (Conceptual)

```mermaid
graph TD
    User[Clientes & Operadores] -->|HTTPS/WSS| CDN[Cloudflare / AWS CloudFront]
    CDN --> LB[Application Load Balancer]
    
    subgraph "Ingesta Layer (Edge)"
        IoT[GPS Trackers / Apps] -->|TCP/UDP/MQTT| IotGateway[IoT Core / Device Gateway]
        IotGateway -->|Raw Stream| Kafka[Apache Kafka / Kinesis]
    end
    
    subgraph "Processing Layer"
        Kafka --> StreamProc[Stream Processors (Flink/Lambda)]
        StreamProc -->|Alert Logic| RulesEngine[Policy Engine (Redis)]
        StreamProc -->|Normalización| DataEnricher[Geocoding & Enricher]
    end
    
    subgraph "Storage Layer"
        DataEnricher -->|Hot Data| TSDB[Time-Series DB (TimescaleDB)]
        DataEnricher -->|Cold Data| DataLake[S3 Data Lake (Parquet)]
        DataEnricher -->|Business Data| RelDB[PostgreSQL (Supabase)]
        StreamProc -->|Evidence| Ledger[Immutable Ledger (QLDB / Merkle Log)]
    end
    
    subgraph "Serving Layer"
        LB --> API[API Gateway (NestJS)]
        API --> RelDB
        API --> TSDB
        API --> Cache[Redis Cache]
        API -->|Real-time| SocketSvc[WebSocket Service]
    end
    
    RulesEngine -->|Notification| NotifSvc[Notification Service (Push/SMS/Email)]
    SocketSvc --> User
```

---

## 3. Servicios y Responsabilidades

### A. Device Gateway (Ingesta)
*   **Tech:** Rust o Go (para máximo throughput).
*   **Responsabilidad:** Mantener conexiones TCP/UDP abiertas con miles de dispositivos. Parsear protocolos binarios (Teltonika, Queclink, Suntech).
*   **Key Feature:** Manejo de Backpressure y Buffering.

### B. Stream Processor (Cerebro)
*   **Tech:** Apache Flink o AWS Kinesis Analytics.
*   **Responsabilidad:**
    1.  Detección de patrones complejos (ej: "Parada > 10min Y Motor Encendido").
    2.  Geofencing en memoria (algoritmos Ray-casting optimizados).
    3.  Cálculo de scores de conducción en ventanas de tiempo.

### C. Truth Layer (Evidencia)
*   **Tech:** Amazon QLDB o Tabla Hash-Chained en Postgres.
*   **Responsabilidad:** Almacenar hash criptográfico de cada evento crítico. Garantizar no-repudio.

### D. API Layer (Backend for Frontend)
*   **Tech:** Node.js (NestJS) + Supabase Edge Functions.
*   **Responsabilidad:** Gestión de usuarios, configuración de flota, reportes, autenticación.

---

## 4. Modelo de Datos Mínimo (Entidades Core)

### `Device`
*   `imei` (PK), `protocol`, `sim_id`, `status`, `last_heartbeat`, `config_hash`.

### `Vehicle`
*   `id` (PK), `plate`, `vin`, `device_imei` (FK), `driver_id` (FK), `attributes` (JSONB).

### `TelemetryEvent` (Time-Series Hypertable)
*   `time` (PK, Partition Key), `device_id`, `lat`, `lng`, `speed`, `heading`, `altitude`, `satellites`, `hdop`, `io_state` (JSONB), `engine_hours`.

### `Alert`
*   `id`, `created_at`, `vehicle_id`, `rule_id`, `severity`, `status` (open, ack, resolved), `assignee_id`.

### `EvidenceLog`
*   `id`, `event_id`, `event_hash`, `prev_hash` (Blockchain link), `signature`, `timestamp`.

---

## 5. Estrategia de Observabilidad y SLOs

Implementaremos **OpenTelemetry** en todos los microservicios.

| Métrica | SLO (Service Level Objective) | Acción ante Incumplimiento |
|---------|-------------------------------|----------------------------|
| **Ingestion Latency** | 99% de eventos procesados en < 200ms | Auto-scaling de consumidores Kafka. |
| **API Availability** | 99.9% respuestas HTTP 2xx/4xx | Failover a región secundaria. |
| **Map Freshness** | Posición en mapa no mayor a 2s de antigüedad | Alerta crítica a equipo DevOps. |

**Dashboard Grafana:**
1.  **Business:** Vehículos online vs totales.
2.  **Tech:** Lag de consumidores Kafka, CPU de base de datos.
3.  **Security:** Intentos de auth fallidos, IPs sospechosas.

---

## 6. Estrategia de Costos (FinOps)

Para optimizar la factura de nube en una plataforma de alto volumen:

1.  **Tiering de Datos:**
    *   **Hot (0-3 meses):** SSD NVMe (TimescaleDB) para consultas rápidas. Costo alto.
    *   **Warm (3-12 meses):** HDD comprimido. Costo medio.
    *   **Cold (>1 año):** S3 Glacier Deep Archive. Costo ínfimo ($0.00099/GB).
2.  **Spot Instances:** Usar instancias Spot para los procesadores de eventos (stateless), ahorrando hasta 70% en cómputo.
3.  **Transferencia de Datos:** Minimizar tráfico inter-AZ (Availability Zone). Procesar en el borde (Edge) lo posible.
4.  **Device Protocol Optimization:** Configurar trackers para enviar deltas o comprimir datos (binario) en lugar de JSON verboso para ahorrar ancho de banda IoT.
