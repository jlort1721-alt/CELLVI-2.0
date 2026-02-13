# Política de Gobernanza de Superusuario (Privileged Access)

Esta política define los controles para el acceso de nivel `postgres` (Superuser) y `service_role` en Producción.

## 1. Principio de Cero Acceso
*   **Regla:** Ningún humano debe tener acceso directo persistente a las credenciales de superusuario.
*   **Estado Normal:** El acceso a la BD es exclusivamente a través de la API/Edge Functions con roles limitados (`authenticated`, `anon`).

## 2. Protocolo "Break-Glass" (Acceso de Emergencia)
En caso de incidente crítico (ej. corrupción de base de datos, bloqueo total):

1.  **Solicitud:** El Ops Lead solicita acceso al "Baúl de Contraseñas" (Vault).
2.  **Aprobación Dual:** Se requiere autorización de un segundo responsable (CTO/CISO).
3.  **Ventana de Tiempo:** El acceso se otorga por un máximo de **1 Hora**.
4.  **Auditoría Forzada:**
    *   Todas las consultas SQL ejecutadas quedan registradas en el log de infraestructura de Supabase (Statement Logging).
    *   Se debe llenar un reporte de incidente post-acceso.

## 3. Controles Técnicos
*   **MFA Obligatorio:** La cuenta de Supabase Dashboard debe tener 2FA activado para todos los administradores.
*   **Rotación Post-Incidente:** Si se usa la contraseña de base de datos directa, esta debe ser rotada inmediatamente después de cerrar el incidente.

## 4. Limitaciones del Superusuario
*   Incluso el superusuario debe respetar las leyes de integridad de negocio.
*   **Prohibido:** Modificar directamente tablas financieras (`integration_jobs`) o forenses (`audit_logs`) para "arreglar" datos. Se deben usar scripts de compensación auditados.
