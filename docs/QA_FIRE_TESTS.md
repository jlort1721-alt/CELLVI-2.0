# Protocolo de Validación Crítica (Fire Tests)

Este documento certifica los procedimientos para validar la integridad transaccional y operativa de la plataforma.

## 🔥 Caso 1: Resiliencia Asíncrona (RNDC/RUNT)
**Objetivo:** Garantizar que la operación no se detiene por caídas del Ministerio.

### Pasos de Ejecución
1.  **Simulación de Fallo:**
    *   Inyectar payload malicioso en el generador de manifiestos: `{ "force_fail": true }`.
2.  **Transmisión:**
    *   Ejecutar envío desde el Dashboard.
    *   **Verificación Inmediata:** La UI no debe mostrar "Cargando..." por más de 1 segundo. Debe responder: *"Solicitud Encolada. ID de Seguimiento: J-12345"*.
3.  **Monitoreo de Background:**
    *   Consultar tabla `integration_jobs`.
    *   El worker debe tomar el job (`status: processing`).
    *   Al fallar, debe pasar a `retrying` (no `failed`).
    *   Verificar `next_run_at` (debe ser +30s en el futuro).
4.  **Recuperación:**
    *   Tras 3 intentos fallidos, el estado final debe ser `dead_letter`.
    *   El tablero de errores debe mostrar la alerta crítica.

## 🕵️‍♂️ Caso 2: Auditoría Forense "Tamper-Proof"
**Objetivo:** Detectar fraude interno o modificaciones no autorizadas.

### Pasos de Ejecución
1.  **El "Cambio Fantasma":**
    *   Usuario A (Admin) modifica la placa de un vehículo (`ABC-123` -> `CLON-01`).
    *   Usuario A revierte el cambio inmediatamente (`CLON-01` -> `ABC-123`).
2.  **Verificación de Evidencia:**
    *   Consultar `SELECT * FROM audit_logs WHERE record_id = 'uuid-vehiculo'`.
    *   **Resultado Obligatorio:** Dos registros independientes.
    *   Registro 1: `action: UPDATE`, `old: {plate: ABC-123}`, `new: {plate: CLON-01}`.
    *   Registro 2: `action: UPDATE`, `old: {plate: CLON-01}`, `new: {plate: ABC-123}`.

## 📡 Caso 3: Continuidad Operativa Offline
**Objetivo:** Validar la "Inspección en Zona Muerta".

### Pasos de Ejecución
1.  **Desconexión:**
    *   Cargar `/preoperacional`.
    *   Desconectar WiFi/Datos (Modo Avión).
2.  **Operación:**
    *   Completar checklist y firmar.
    *   Clic en "Enviar". La App debe guardar en `IndexedDB` y mostrar indicador "Pendiente de Sync" (Nube tachada).
3.  **Persistencia:**
    *   Cerrar navegador (Kill Process).
    *   Reabrir navegador (aún sin red).
    *   El formulario debe estar ahí o en la cola de salida.
4.  **Sincronización:**
    *   Conectar Red.
    *   El Service Worker debe detectar conexión y vaciar la cola hacia `supabase.from('pesv_inspections').insert()`.

## ✅ Criterios de Aceptación Global
*   **0 Bloqueos de UI:** Ninguna acción externa bloquea la interfaz principal.
*   **0 Pérdida de Datos:** Todo cambio deja rastro en `audit_logs`.
*   **Recuperación Automática:** Los jobs fallidos se reintentan sin intervención humana inicial.
