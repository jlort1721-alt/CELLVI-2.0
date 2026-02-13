# Protocolo de Certificación GO/NO-GO v2.0 (Audit Type 2 Standard)

Este documento define la **Matriz de Aceptación Forense** para autorizar el despliegue a Producción.
Todas las pruebas deben ejecutarse en un entorno `Staging` idéntico a `Prod`.

**Fecha de Ejecución:** T-Minus 24h.
**Pre-requisito:** Ejecutar `scripts/go_live_drill.sh` (Simulación de estrés).

---

## �️ GATE 1: RESILIENCIA E INTEGRIDAD TRANSACCIONAL
**Objetivo:** Demostrar cero pérdida de datos durante picos de carga RNDC.

#### Prueba 1.1: Reconciliación (Ledger Balance)
*   **Comando SQL:**
    ```sql
    SELECT 
        CASE WHEN ledger_status = 'BALANCED' THEN 'PASS' ELSE 'FAIL' END as result,
        total_jobs, 
        failed as dead_letter_count
    FROM public.audit_rndc_ledger;
    ```
*   **Criterio de Aceptación (PASS):**
    *   Result = `PASS` (Suma de estados coincide con total).
    *   Dead Letter Count < 1% del volumen de prueba (ej. < 10 fallos en 1000 jobs).

#### Prueba 1.2: Idempotencia (No Duplicados)
*   **Comando SQL:**
    ```sql
    SELECT 
        CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END as result
    FROM (
        SELECT idempotency_key, COUNT(*) 
        FROM public.integration_jobs 
        WHERE idempotency_key IS NOT NULL 
        GROUP BY idempotency_key 
        HAVING COUNT(*) > 1
    ) dups;
    ```
*   **Criterio:** Result = `PASS` (Ninguna llave idempotente repetida).

---

## 🚧 GATE 2: PROTECCIÓN Y GOBERNANZA (RATE LIMITS)
**Objetivo:** Confirmar que un ataque de fuerza bruta no tumba la plataforma.

#### Prueba 2.1: Bloqueo Efectivo
*   **Escenario:** Tenant "Attacker" envía 200 requests/min (Límite=100).
*   **Comando SQL:**
    ```sql
    SELECT 
        tenant_name, 
        compliance_status 
    FROM public.audit_ratelimit_compliance 
    WHERE tenant_name = 'Attacker Corp';
    ```
*   **Criterio:** Status = `VIOLATION` (El sistema detectó y reportó el abuso).

#### Prueba 2.2: Aislamiento de Vecinos (Noisy Neighbor)
*   **Comando SQL:**
    ```sql
    SELECT COUNT(*) as affected_innocents 
    FROM public.audit_ratelimit_compliance 
    WHERE tenant_name != 'Attacker Corp' AND compliance_status != 'PASS';
    ```
*   **Criterio:** 0 (Ningún otro tenant se vio afectado).

---

## 🕵️‍♂️ GATE 3: INTEGRIDAD FORENSE (AUDIT CHAIN)
**Objetivo:** Validar inmutabilidad de logs.

#### Prueba 3.1: Verificación de Cadena Hash
*   **Comando Shell:**
    ```bash
    node scripts/audit_chain_verify.js
    ```
*   **Salida Esperada:**
    ```text
    ✅ CADENA ÍNTEGRA. Ninguna alteración detectada.
    ```
*   **Criterio:** Exit Code 0.

---

## ⚖️ GATE 4: CUMPLIMIENTO LEGAL (SLO EVIDENCE)
**Objetivo:** Persistencia de evidencia de niveles de servicio.

#### Prueba 4.1: Reporte Firmado
*   **Comando SQL:**
    ```sql
    SELECT 
        CASE WHEN report_hash IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as integrity_check,
        status as slo_status
    FROM public.slo_reports 
    ORDER BY generated_at DESC LIMIT 1;
    ```
*   **Criterio:** Integrity = `PASS`, SLO Status = `PASS` (o `WARNING` justificado).

---

## 🚑 GATE 5: RECUPERACIÓN DE DESASTRES (RTO)
**Objetivo:** Restore < 4 Horas verificado.

#### Prueba 5.1: Tiempo de Restauración
*   **Evidencia:** Logs del script `dr_backup_restore.sh`.
*   **Cálculo:** `Timestamp_Final_Restore` - `Timestamp_Inicio_Incidente`.
*   **Criterio:** < 14400 segundos (4 Horas).

---

## 📝 DECISIÓN FINAL

| Gate | Resultado (PASS/FAIL) | Hash Evidencia (opcional) |
| :--- | :---: | :--- |
| 1. Resiliencia | [ ] | |
| 2. Protección | [ ] | |
| 3. Integridad | [ ] | |
| 4. Legalidad | [ ] | |
| 5. Recuperación | [ ] | |

**Veredicto:**
[ ] **GO (APROBADO)** - Todos los Gates en PASS.
[ ] **NO-GO (RECHAZADO)** - Al menos 1 Gate en FAIL.

**Firmas:**
__________________________ (CTO)
__________________________ (Compliance Officer)
