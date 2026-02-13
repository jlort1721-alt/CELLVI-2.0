# INCIDENT RESPONSE PLAYBOOK (The Red Button)

**Prioridad:** CRÍTICA 🚨
**Activación:** Ante cualquier anomalía de seguridad o caída de servicio > 5 minutos.

## Nivel 1: Caída de Servicio (Downtime)

### Escenario A: Base de Datos Inaccesible
1.  **Verificar Status:** [status.supabase.com](https://status.supabase.com)
2.  **Modo Offline:** La PWA debe seguir funcionando para conductores en local.
3.  **Comunicación:** Enviar email a clientes: "Mantenimiento No Programado".
4.  **Recuperación:** Si es fallo de región, activar Replica de Lectura en AWS `us-east-1` (Requiere configuración Enterprise).

### Escenario B: API Gateway Caído
1.  **Impacto:** Clientes externos (SAP/Oracle) no pueden inyectar pedidos.
2.  **Mitigación:** Redirigir tráfico DNS (Cloudflare) a `region-fallback`.
3.  **Logs:** Revisar Dashboard de Edge Functions en Supabase. Si hay error 500 masivo: `Revert Deploy` via CLI.

## Nivel 2: Incidente de Seguridad (Breach)

### Escenario C: Fuga de API Key (Tenant)
1.  **Detección:** Tráfico inusual desde IP desconocida o reporte de cliente.
2.  **Contención Inmediata:**
    ```bash
    # Revocar Key en DB
    UPDATE tenants SET api_key = uuid_generate_v4() WHERE id = 'tenant_compromised';
    ```
3.  **Investigación Forense:** Descargar `audit_logs` filtrando por la key anterior.
4.  **Notificación Legal:** Informar a cliente afectado dentro de 72h (GDPR/Compliance).

### Escenario D: Ataque de Fuerza Bruta (Login)
1.  **Defensa:** El Rate Limiting de Supabase Auth actúa automáticamente.
2.  **Bloqueo Manual:** Agregar IP atacante a la lista negra en WAF (Cloudflare/Vercel).

## Nivel 3: Corrupción de Datos (Integridad)

### Escenario E: Borrado Accidental de Pedidos
1.  **Verificación:** ¿Fue soft-delete o hard-delete? (RLS debería prevenir hard-delete).
2.  **Restauración (Point-in-Time Recovery):**
    *   Ir a Supabase Dashboard -> Database -> Backups.
    *   Seleccionar PITR y restaurar clon de DB al momento `T-10min`.
    *   Extraer datos faltantes e insertar en Producción.

---

## Contactos de Emergencia (Escalación)
*   **CTO (Antigravity):** [Slack Channel #incident-war-room]
*   **Soporte Supabase:** support@supabase.io (Ticket P1 - Business Critical)
*   **Infraestructura:** [Link a PagerDuty]
