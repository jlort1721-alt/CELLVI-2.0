# Roadmap de Implementación Detallado y Plan de Despliegue
**Documento Táctico de Ejecución** | **Fase:** Day 1 to Year 1

Este documento desglosa el Plan Maestro en tareas de ingeniería ejecutables, define la matriz de responsabilidades y la estrategia de despliegue progresivo.

---

## 1. Matriz RACI (Operaciones / Cumplimiento / Mantenimiento)
*Responsable (R), Aprobador (A), Consultado (C), Informado (I)*

| Proceso | Director Ops (COO) | Jefe Flota | Operador Torre | Developer | Auditor HSEQ | Gerente Gral |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Definición Reglas GPS** (Excesos, Geocercas) | **A** | **R** | C | I | C | I |
| **Gestión Vencimientos** (SOAT/Licencias) | A | **R** | I | I | **C** | I |
| **Programación Mantenimiento** (Preventivo) | I | **R** | I | I | I | I |
| **Salida a Operación** (Viajes/Despachos) | I | C | **R** | I | I | I |
| **Integración RNDC/FUEC** (Errores API) | A | C | **R** | **R** (Fix) | C | I |
| **Auditoría de Evidencia** (Siniestros) | I | C | I | C | **R** | **A** |
| **Despliegue Nuevas Features** | C | I | I | **R** | C | **A** |

---

## 2. Estrategia de Despliegue (Phased Rollout)

### Etapa 1: "Pilot - The Truth Core" (Mes 1-3)
*Objetivo: Migrar 50 vehículos y validar la integridad de datos.*
*   **Alcance:** Ingesta GPS, Alertas Básicas, Documentos (Vencimientos), App Preoperacional (Alpha).
*   **Entorno:** Tenant único (`pilot_tenant`), Hardware Tier 1 (Teltonika).
*   **Hardening:** Auditoría manual diaria de datos vs. realidad.

### Etapa 2: "Multi-tenant - Operations Shield" (Mes 4-6)
*Objetivo: Abrir a 3 empresas clientes. Integración RNDC unidireccional.*
*   **Alcance:** Módulo de Viajes, RLS estricto, Integración RNDC (Generar Manifiesto), Workflows Mantenimiento.
*   **Seguridad:** Penetration Testing sobre aislamiento de tenants.

### Etapa 3: "Ecosystem - Connected World" (Mes 7-12)
*Objetivo: Integraciones ERP y App Conductor Full.*
*   **Alcance:** Webhooks salientes a SAP, RNDC Bidireccional, Detector de Fatiga (Hardware Tier 3).
*   **Plugin:** Activación adaptador DUTT para piloto internacional.

---

## 3. Backlog de Ingeniería Detallado (Epics & Tasks)

### FASE 1: MVP (Control Total) - 90 Días

#### Epic 1.1: Core Data & Truth Layer
- [ ] **DB Schema:** Implementar migraciones de `trips`, `maintenance`, `work_orders`.
- [ ] **Policy Engine:** Migrar lógica de alertas a tabla `policies` (JSON Rules).
- [ ] **Escalation Service:** Worker que monitorea `alerts` no gestionadas > 2h -> Email a Jefe de Flota.

#### Epic 1.2: IoT Ingestion (Edge)
- [ ] **Teltonika Parser:** Edge function que decodifica Codec8 UDP/TCP.
- [ ] **Stream Processor:** Normalizar eventos y guardar en `device_messages_raw` y `telemetry_events`.
- [ ] **Ignition Logic:** Detección de paradas (Stop detection) basada en ignición virtual (acelerómetro).

#### Epic 1.3: Compliance Hub (Docs)
- [ ] **Doc Scanner:** UI para subir fotos de SOAT/Tecno.
- [ ] **OCR Light:** (Opcional) Extracción automática de fechas de vencimiento con AWS Textract o Vision API.
- [ ] **Alert Scheduler:** Cronjob diario para notificar vencimientos (30, 15, 7, 1 dias).

#### Epic 1.4: App Móvil (Preoperacional)
- [ ] **Offline Sync Engine:** Configurar WatermelonDB y esquema de sincronización.
- [ ] **Formulario Dinámico:** Renderizar checklist basado en JSON del servidor.
- [ ] **Photo Proof:** Captura de cámara con timestamp quemado en la imagen (watermark).

---

### FASE 2: V1 (Operación Integrada) - 180 Días

#### Epic 2.1: Módulo de Operaciones (Viajes)
- [ ] **Trip Builder:** UI para crear viaje (Origen, Destino, Placa, Conductor).
- [ ] **Hard Stop Logic:** Middleware que impide crear viaje si `vehicle.active == false` o `docs.expired == true`.
- [ ] **Chat por Entidad:** Feed de comentarios en el detalle del Viaje (`trip_comments` table).

#### Epic 2.2: RNDC Connector (La Pesadilla)
- [ ] **SOAP Wrapper:** Deno module para generar XML firmado de MinTransporte.
- [ ] **Queue Worker:** Sistema de encolamiento `pg_mq` para reintentos de transmisión.
- [ ] **Error Dashboard:** UI para corregir errores de validación RNDC sin tocar código.

#### Epic 2.3: FUEC Generator
- [ ] **PDF Engine:** Generación de PDF con `pdf-lib` incluyendo QR de verificación.
- [ ] **Crypto Signer:** Firma digital del PDF con certificado de la empresa.

---

### FASE 3: V2 (IA & Escala) - 360 Días

#### Epic 3.1: IA Operativa
- [ ] **Anomaly Detector:** Worker en Python (vía Http call) para detectar caídas de combustible anómalas.
- [ ] **RAG Ops Assistant:** Chatbot que consulta `compliance_documents` y responde "¿Quién tiene licencia vencida?".

#### Epic 3.2: DUTT & Internacional
- [ ] **Plugin Architecture:** Abstraer lógica de "Manifiesto" para soportar DUTT (Documento Único de Transporte Turístico).
- [ ] **Multi-currency:** Soporte de viáticos en USD/COP.

---

## 4. Plan de Pruebas de Fuego (Drills)

| Prueba | Descripción | Criterio de Éxito |
| :--- | :--- | :--- |
| **"The Zombie Truck"** | Vehículo dado de baja intenta salir a operación. | El sistema impide crear el viaje (Hard Stop). |
| **"Offline Apocalypse"** | Conductor realiza toda la ruta sin datos y sincroniza al final. | Trazabilidad completa, timestamps originales respetados. |
| **"RNDC Down"** | Simular caída 503 del ministerio por 6 horas. | Ningún viaje se pierde; cola procesa todo al volver. |
| **"Audit Tamper"** | Admin de BD intenta cambiar lat/lng de un siniestro. | Hash chain se rompe, alerta de integridad disparada. |
