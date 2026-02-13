# Manual de Operaciones Críticas (Runbooks) - CELLVI 2.0

Este documento es la biblia operativa para el soporte L2/L3. Cuando suene la alarma, siga estos pasos.

## 🚨 Incidente A: Fallo Masivo de Integración (RNDC DLQ)
**Síntoma:** Tablero `integration_jobs` muestra > 50 jobs en estado `dead_letter` en la última hora.
**Causa probable:** Caída del Ministerio de Transporte o cambio de esquema XML no anunciado.

### Procedimiento de Respuesta
1.  **Diagnóstico:**
    *   Consultar `SELECT dlq_reason, count(*) FROM integration_jobs WHERE status='dead_letter' GROUP BY dlq_reason`.
    *   Si el error es `504 Gateway Timeout`: Es problema del Ministerio.
    *   Si el error es `Schema Validation Failed`: El XML generado es inválido (Bug o Cambio Normativo).

2.  **Mitigación:**
    *   **Si es Temporal (Timeout):**
        ```sql
        -- Reencolar jobs muertos para reintento (Backoff 5 min)
        UPDATE integration_jobs 
        SET status='queued', next_run_at=NOW() + interval '5 minutes', attempts=0 
        WHERE status='dead_letter' AND dlq_reason LIKE '%Timeout%';
        ```
    *   **Si es Estructural (Schema):**
        *   PAUSAR COLA: `UPDATE app_settings SET rndc_enabled=false`.
        *   Hotfix en `rndcService.ts` -> Deploy.
        *   Reprocesar: `UPDATE integration_jobs SET status='queued' ...` una vez desplegado el fix.

## 🚨 Incidente B: Alerta de Integridad Forense (Tampering)
**Síntoma:** El script `audit_chain_verify.js` reporta `BROKEN LINK en Seq #12345`.
**Causa probable:** Un DBA o atacante modificó/borró un registro directamente en SQL, rompiendo la cadena de hashes.

### Procedimiento de Respuesta
1.  **Aislamiento:**
    *   Identificar el `trace_id` o `actor_user_id` del bloque roto.
    *   **Bloquear acceso al usuario sospechoso inmediatamente.**
    *   Tomar snapshot de la DB (`pg_dump`) para evidencia legal.

2.  **Análisis Forense:**
    *   Comparar `prev_hash` del bloque N con `hash` del bloque N-1.
    *   Si no coinciden, el bloque N-1 fue alterado o el bloque N fue inyectado.
    *   Restaurar backup a un punto anterior al incidente en un entorno aislado para comparar.

## 🚨 Incidente C: Bucle de Sincronización Offline (Conflict Loop)
**Síntoma:** Usuario reporta "No puedo enviar la inspección, siempre sale error".
**Causa probable:** El registro en el servidor cambió mientras el usuario estaba offline, y la regla `Last-Write-Wins` está rechazando la actualización por `version_mismatch`.

### Procedimiento de Respuesta
1.  **Forzar Sincronización (Server-Side):**
    *   Solicitar al usuario que envíe el JSON de su `outbox` (botón "Exportar Debug" en App).
    *   Comparar con DB.
    *   Si el dato del usuario es más reciente/válido, aplicar manualmente o instruir al usuario a "Descartar y Recargar" si el servidor tiene la verdad.

## 📜 Política de Backups y DR (Disaster Recovery)
*   **RPO (Pérdida Máxima Aceptable):** 24 Horas (Backup Diario Automático).
*   **RTO (Tiempo de Recuperación):** 4 Horas.
*   **Prueba de Restauración:** Mensualmente, el día 1, restaurar el backup de Prod en Staging y ejecutar `fire_test.js`.

---
**Contactos de Escalación:**
*   DevOps Lead: [Nombre]
*   Legal/Compliance: [Nombre]
*   Soporte Proveedor RNDC: [Teléfono]
