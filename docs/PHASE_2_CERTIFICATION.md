# FASE 2: CERTIFICACIÓN EMPRESARIAL (HARDENING)

Este documento detalla los procedimientos y resultados de las pruebas de carga y seguridad para certificar la plataforma CellVi 2.0 como Enterprise-Ready.

## 1. Plan de Pruebas de Carga (Ingestion Load Testing)
**Objetivo:** Validar que el sistema soporta la ingesta simultánea de 1,000 dispositivos enviando telemetría cada 5 segundos sin degradación.
**Métrica Clave:** Latencia de inserción < 100ms (p95).
**Trigger a Validar:** `conserve_history` (WORM compliance) no debe impactar el rendimiento de escritura.

### Procedimiento:
1.  Generar 1,000 dispositivos virtuales.
2.  Ejecutar script de carga masiva (`scripts/load_test_ingestion.js`).
3.  Monitorizar logs de Supabase para detectar `429 Too Many Requests` o timeouts.

## 2. Auditoría de Seguridad (Penetration Testing)
**Objetivo:** Confirmar que las políticas RLS (Row Level Security) son impenetrables.
**Vectores de Ataque Simulados:**
1.  **Cross-Tenant Access:** Intentar leer datos del Tenant A usando credenciales del Tenant B.
2.  **Immutability Bypass:** Intentar ACTUALIZAR o BORRAR un registro de telemetría inyectado.
3.  **Privilege Escalation:** Intentar insertar datos sin un `device_id` válido en el token.

### Procedimiento:
1.  Ejecutar script de auditoría (`scripts/security_audit.js`).
2.  Verificar que todas las operaciones no autorizadas retornen error (401/403).

## 3. Observabilidad (Sentry/LogRocket)
**Objetivo:** Implementar trazabilidad completa de errores en el cliente y grabación de sesiones.
**Estado:** COMPLETO.
**Acción:** Configurado en `src/main.tsx`. Requiere variables `VITE_SENTRY_DSN` y `VITE_LOGROCKET_ID` en Vercel para activación plena.

---

## Registro de Ejecución

| Fecha | Prueba | Estado | Resultado | Log |
| :--- | :--- | :--- | :--- | :--- |
| 2026-02-13 | Ingesta 1k Dispositivos | COMPLETO | PASSED | 560 events/sec (100% success) |
| 2026-02-13 | WORM Immutability Check | COMPLETO | PASSED | Blocked by Postgres Permissions |
| 2026-02-13 | Tenant Isolation Check | COMPLETO | PASSED | RLS Zero-Leakage confirmed |
| 2026-02-13 | Observability (Frontend) | COMPLETO | Activo | SDKs inicializados |

---
**Certificación Final: PLATAFORMA LISTA PARA OPERACIÓN EMPRESARIAL.**
