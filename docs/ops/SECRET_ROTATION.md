
# Protocolo de Rotación de Secretos (Zero Downtime)

Este documento define cómo cambiar credenciales críticas (RNDC, RUNT, Pasarelas) sin detener la operación.

## 1. Alcance
Aplica para:
*   Contraseñas de acceso al Ministerio de Transporte (RNDC).
*   Tokens de API RUNT / GPS.
*   Llaves de firma digital (Certicámara).

## 2. Herramientas
*   **Bóveda:** Tabla `tenant_credentials` (Cifrada con pgcrypto / claves de Supabase).
*   **Interfaz:** Admin Dashboard (o API Privada). **NUNCA** modificar SQL directo en producción.

## 3. Procedimiento Paso a Paso

### Paso 1: Obtener Nuevas Credenciales
1.  Solicitar cambio de contraseña en el portal del tercero (ej. `rndc.mintransporte.gov.co`).
2.  Guardar la nueva contraseña en un gestor de contraseñas seguro temporalmente.

### Paso 2: Rotación en Caliente (Hot Swap)
1.  Conectarse a la BD de Producción con usuario `service_role` (o Admin).
2.  Ejecutar la función segura de actualización:

    ```sql
    -- Ejemplo Conceptual de Rotación
    SELECT rotate_tenant_credential(
        'uuid-del-tenant',
        'RNDC',
        'viejo-usuario',
        'NUEVA-CONTRASEÑA-SUPER-SEGURA-2026'
    );
    ```

    *Nota: La función `rotate_tenant_credential` debe encriptar el valor antes de guardarlo.*

### Paso 3: Verificación Inmediata
1.  Disparar un Job de Prueba (`integration_jobs`) para ese Tenant específico.
2.  Monitorear `ops_integration_summary`.
    *   Si Status = `completed`: ✅ ÉXITO.
    *   Si Status = `dead_letter` (Auth Error): ❌ FALLO.
        *   **Rollback Inmediato:** Ejecutar Paso 2 con la contraseña anterior.

## 4. Auditoría Post-Cambio
1.  Consultar `audit_logs`:
    ```sql
    SELECT * FROM audit_logs 
    WHERE table_name = 'tenant_credentials' 
    ORDER BY created_at DESC LIMIT 1;
    ```
2.  Verificar que el `new_value` **NO** muestre la contraseña en texto plano (debe estar enmascarada o hasheada en el log).

## 5. Política de Caducidad
*   **RNDC:** Rotar cada 90 días.
*   **API Tokens:** Rotar anualmente.
*   **Incidentes:** Rotar inmediatamente si hay sospecha de compromiso.
