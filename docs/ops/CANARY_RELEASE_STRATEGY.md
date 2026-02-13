
# Estrategia de Canary Release & Rollback

Este documento define la metodología para desplegar nuevas versiones de la plataforma sin riesgo de impacto masivo.

## 1. Canary: El Principio del 1%
Nunca despliegue el 100% de tráfico a una nueva versión.
*   **Tenant Piloto:** Seleccione 1-2 clientes de confianza (Beta Testers).
*   **Feature Flags:** Utilice la tabla `app_settings` o `feature_flags` para habilitar nuevas funciones solo para `tenant_id` específicos.

## 2. Fases de Despliegue (Timeline Sugerido: T+0 a T+7 Días)

| Fase | Alcance | Duración | Criterio de Pase |
| :--- | :--- | :--- | :--- |
| **Canary** | 1 Tenant (Piloto) | 24-48 Horas | 0 Errores Críticos. Feedback positivo. |
| **Early Adopters** | 10% Tenants (Bajo Vol.) | 24 Horas | Metricas de carga estables. No regresiones. |
| **General Availability** | 100% Tenants | Indefinido | SLOs cumplidos por > 7 días. |

## 3. Plan de Rollback (Botón de Pánico)

### Nivel 1: Reversión de Funcionalidad (Feature Flag)
Si el fallo es lógico (bug funcional):
1.  Acceder al Panel de Admin.
2.  Apagar el Flag: `UPDATE feature_flags SET is_enabled = false WHERE feature = 'new_rndc_flow'`.
3.  **Impacto:** Inmediato, cero downtime.

### Nivel 2: Reversión de Código (Git Revert)
Si el fallo es en Edge Functions o Frontend:
1.  En GitHub: Revertir PR de Release.
2.  El CI/CD despliega la versión anterior automáticamente.
3.  **Impacto:** 5-10 minutos de inestabilidad potencial durante deploy.

### Nivel 3: Restauración de Datos (DR)
Si la migración corrompió datos (Fallo Catastrófico):
1.  **ALERTA ROJA:** Activar "Maintenance Mode" en Edge.
2.  Ejecutar `scripts/dr_backup_restore.sh` apuntando al snapshot pre-deploy.
3.  **Impacto:** Pérdida de datos desde el fallo (RPO < 1h) y tiempo fuera (RTO < 4h).

## 4. Freeze Window (Ventanas de Congelamiento)
*   **Prohibido Desplegar:**
    *   Viernes después de las 14:00.
    *   Fines de semana o festivos.
    *   Fechas críticas de operación logística (Black Friday, Cierre Fiscal).
