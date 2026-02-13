# Protocolo de Simulacro de Go-Live (Phase 8 Drill)

Este documento es el guion oficial para validar la "Operational Readiness" antes de encender producción.
**Fecha Sugerida:** T-Minus 7 Días.
**Responsable:** DevOps Lead + Compliance Officer.

## 🕒 Cronograma del Simulacro (4 Horas)

### Hora 1: Resiliencia y Caos (RNDC Failure)
*   **09:00 - Acción:** Desactivar worker (`integration-worker`) o simular timeout 100%.
*   **09:10 - Carga:** Generar 100 manifiestos concurrentes con script `k6`.
*   **Resultado Esperado:** 
    *   UI responde "Encolado" en <200ms (P95).
    *   Cola `integration_jobs` crece a 100 items. Status=`queued`.
    *   **NO** hay errores 500 en Frontend.
*   **09:30 - Recuperación:** Reactivar worker.
*   **Resultado Esperado:**
    *   Throughput del worker procesa la cola en < 2 minutos.
    *   DLQ vacío (u 1-2 fallos simulados).
    *   **Alerta de Lag:** Debe haber llegado Slack/Email "Worker Lag > 50".

### Hora 2: Ataque de "Tenant Ruidoso" (Rate Limits)
*   **10:00 - Acción:** Script malicioso intenta enviar 1000 requests/minuto con `Token-Tenant-A`.
*   **Resultado Esperado:**
    *   Primeros 50 requests pasan (Status 200).
    *   Request #51 en adelante recibe `429 Too Many Requests` o el worker los rechaza con `QuotaExceeded`.
    *   Otros Tenants (B, C) operan normal (latencia < 500ms).

### Hora 3: Disaster Recovery (Restore Test)
*   **11:00 - Acción:** "Borrar accidentalmente" tabla `vehicles` en Staging.
*   **Verificación:** App Staging rota (Error 500).
*   **11:05 - Respuesta:** Ejecutar `./scripts/dr_backup_restore.sh restore-test`.
*   **Resultado Esperado:**
    *   Script descarga último backup de Prod (simulado).
    *   Restaura Staging.
    *   Tiempo total < 15 minutos (RTO).
    *   App Staging funcional de nuevo.

### Hora 4: Rotación de Secretos y SLO Report
*   **12:00 - Acción:** Cambiar contraseña de usuario RNDC en Ministerio (Simulado).
*   **12:10 - Rotación:** Ejecutar procedimiento `docs/ops/SECRET_ROTATION.md`.
    *   Actualizar `tenant_credentials` via API segura (sin deploy de código).
*   **12:30 - Validación:** Enviar manifiesto de prueba. Debe ser exitoso con nueva clave.
*   **12:45 - Cierre:** Ejecutar `slo-reporter` manualmente. Verificar reporte en Slack.

---

## ✅ Criterios de Go-Live (Checklist Final)
[ ] RNDC Resiliencia probada (Cola drenada sin pérdida).
[ ] Rate Limits efectivos (Tenant A aislado de Tenant B).
[ ] Restore Test exitoso en < RTO (4h).
[ ] Rotación de secretos sin downtime (Zero-downtime).
[ ] Reporte SLO muestra disponibilidad > 99.5% en entorno de prueba.

**Si todos los checks están verdes, firmar Acta de Go-Live.**
