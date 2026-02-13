# CELLVI 2.0 Enterprise Checklist

**Objetivo:** Validar que todos los componentes del sistema Enterprise estén correctamente desplegados y operativos.

## 1. Infraestructura de Base de Datos
- [ ] **PostGIS Habilitado:**
    - Verificar que la tabla `geofences` tiene la columna `geom` de tipo `GEOGRAPHY(POLYGON, 4326)`.
    - Comando de verificación: `SELECT postgis_full_version();`
- [ ] **Tablas Enterprise Creadas:**
    - `spare_parts`: Inventario de repuestos.
    - `maintenance_plans`: Planes preventivos.
    - `maintenance_logs` y `fuel_logs`: Logs de inteligencia predictiva.
    - `audit_logs`: Trazabilidad forense.
- [ ] **Seguridad (RLS):**
    - Verificar que todas las tablas tengan `ENABLE ROW LEVEL SECURITY`.
    - Verificar políticas de aislamiento por `tenant_id`.

## 2. Frontend y PWA
- [ ] **Compilación Exitosa:**
    - Ejecutar `npm run build` sin errores de TypeScript.
    - Verificar la carpeta `dist/` generada.
- [ ] **Service Worker (Offline):**
    - Probar en modo avión que `/preoperacional` carga datos en caché.
    - Verificar instalación de PWA en móvil.

## 3. Integración de Servicios
- [ ] **RNDC (Manifiestos):**
    - Probar generación de XML de manifiesto.
    - Verificar envío simulado a Ministerio de Transporte.
- [ ] **Mapas:**
    - Verificar que los mapas carguen correctamente (requiere API Key de proveedor si aplica, o Leaflet OSM).

## 4. Mantenimiento y Analítica
- [ ] **Flujo de Orden de Trabajo:**
    - Crear una Orden -> Asignar Repuesto -> Completar -> Verificar descuento de stock.
- [ ] **Reportes:**
    - Verificar que los gráficos en `/reportes` muestran datos reales (no mocks).

## 5. Auditoría Final
- [ ] **Logs de Seguridad:**
    - Simular un evento crítico (ej. "JAMMING") y verificar que aparezca en `/seguridad` y en `audit_logs`.

---
**Firmado:** Antigravity AI Agent
**Fecha:** 13 de Febrero de 2026
