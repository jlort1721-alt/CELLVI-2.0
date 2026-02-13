# Acta de Autorización de Go-Live (Deployment Authorization)

**ID del Cambio:** ______________________ (Ticket Jira/ServiceNow)
**Proyecto:** CELLVI 2.0 (SaaS Logistics Platform)
**Fecha (Effective Date):** __________________
**Zona Horaria:** [ ] UTC-5 (Colombia) [ ] UTC

---

## 1. Alcance y Congelamiento
Este despliegue corresponde a la versión inmutable del código fuente y configuración, bajo los términos del "No Repudio" (Non-Repudiation):

*   **Versión del Release (Tag):** ______________________ (ej. `v2.0.0-GA`)
*   **Git Commit Hash (Full SHA-1):** __________________________________________________
*   **Ambiente Destino:** PRODUCCIÓN
    *   **URL:** ________________________________ (ej. `https://app.cellvi.com`)
    *   **Región:** AWS us-east-1 / Supabase Managed Cloud

---

## 2. Matriz de Inclusión (Scope)
Este despliegue afecta exclusivamente a los siguientes componentes:
*   [x] **Backend Core:** Supabase SQL Schemas & Edge Functions.
*   [x] **Frontend:** SPA Hosting (Vercel/Netlify).
*   [x] **Integration:** RNDC Worker v2.
*   [ ] **Excluido:** Configuración de DNS, Proveedor de Identidad (Auth0/Supabase Auth), Storage Buckets.

---

## 3. Evidencia de Certificación (Forensic Link)
Se certifica que el paquete de evidencia fue generado en un entorno de **Staging** equivalente a Producción el día __________________.

**Ubicación de Evidencia (URI):** `s3://cellvi-compliance-prod/releases/v2.0.0/evidence_pack.zip`

| Artefacto Crítico | Hash SHA-256 (Checksum) | Estado | Validado Por |
| :--- | :--- | :---: | :--- |
| **Evidence Pack (ZIP)** | ________________________________________________________________ | PASS | (Firma Ops) |
| **Protocolo Drill (PDF)** | ________________________________________________________________ | PASS | (Firma QA) |
| **SLO Report (JSON)** | ________________________________________________________________ | PASS | (Firma Tech) |

*Advertencia Legal: Si el hash del archivo ZIP almacenado no coincide carácter por carácter con el escrito arriba, esta autorización es NULA.*

---

## 4. Matriz de Cumplimiento (Gatekeepers)

| Control | Criterio Estricto | ¿Cumple? |
| :--- | :--- | :---: |
| **Integridad RNDC** | Ledger Balanceado (0 Jobs Perdidos) | [SI] / [NO] |
| **Seguridad RLS** | Test de Aislamiento en Verde (0 Fugas) | [SI] / [NO] |
| **Recuperación** | Restore Test en Tiempo < RTO (4h) | [SI] / [NO] |
| **Inmutabilidad** | Audit Chain Verify OK (0 Roturas) | [SI] / [NO] |
| **Protección** | Rate Limits Activos y Probados | [SI] / [NO] |

---

## 5. Plan de Lanzamiento (Runbook)
*   **Ventana de Cambio:** __________ a __________ (Hora Local).
*   **Duración Estimada:** ______ minutos.
*   **Rollback Trigger:** Error Rate > 0.5% durante > 10 min.
*   **Estrategia:** Canary Release (Tenant Piloto: ____________________).

---

## 6. Declaración Jurada y Firmas
Los firmantes autorizan el despliegue a Producción, certificando que no existen vulnerabilidades críticas conocidas y que se ha cumplido el protocolo de auditoría `GO_NO_GO_PROTOCOL.md`.

**Tech Lead (Ingeniería)**
Nombre: ______________________ Firma: ______________________ Fecha: __________

**Ops Lead (Infraestructura)**
Nombre: ______________________ Firma: ______________________ Fecha: __________

**Compliance Officer (Auditor)**
Nombre: ______________________ Firma: ______________________ Fecha: __________

---
**RESULTADO FINAL:** [ ] GO (APROBADO) [ ] NO-GO (DENEGADO)
