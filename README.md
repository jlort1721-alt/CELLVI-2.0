# CELLVI 2.0 Enterprise Edition

**CELLVI 2.0** es la plataforma de logística cognitiva definitiva. Un sistema SaaS de grado militar diseñado para la gestión de flotas, cumplimiento normativo (RNDC/PESV) y seguridad operativa avanzada.

Esta versión **Enterprise Edition** incluye módulos completos para control de activos, mantenimiento predictivo, auditoría forense y operaciones en tiempo real.

## 🚀 Módulos del Sistema

### 1. Centro de Comando (`/dashboard`)
*   **Torre de Control:** Visualización unificada de flota, alertas críticas y KPIs operativos en tiempo real.
*   **Geofencing Avanzado:** Detección de zonas seguras y prohibidas con motor geoespacial PostGIS.

### 2. Operaciones de Campo (PWA)
*   **Inspección Preoperacional (`/preoperacional`):** Lista de chequeo digital obligatoria para conductores, fully offline-capable.
*   **Reporte de Novedades:** Registro fotográfico de incidentes en ruta.

### 3. Gestión de Mantenimiento (`/mantenimiento`)
*   **Órdenes de Trabajo:** Ciclo completo de reparación (Preventivo/Correctivo).
*   **Inventario de Repuestos (`/mantenimiento/inventario`):** Control de stock, costos y ubicación de autopartes.
*   **Planes Preventivos:** Alertas automáticas basadas en odómetro y tiempo.

### 4. Cumplimiento Legal (`/rndc`)
*   **Ministerio de Transporte:** Generación automática de manifiestos de carga electrónicos.
*   **PESV:** Auditoría de seguridad vial y gestión documental de conductores.

### 5. Seguridad y Auditoría (`/seguridad`)
*   **Detección de Amenazas:** Alertas inmediatas de Jamming GNSS, desconexión de baterías y apertura de puertas no autorizada.
*   **Audit Log Forense (`/auditoria`):** Trazabilidad inmutable de todas las acciones del sistema.

### 6. Inteligencia de Negocios (`/reportes`)
*   **Eficiencia de Combustible:** Análisis real de consumo vs. distancia recorrida.
*   **Costos Operativos:** Desglose financiero de mantenimiento por vehículo y flota.

## 🛠 Arquitectura Técnica

*   **Frontend:** React 18, TypeScript, Vite, TailwindCSS (Shadcn/ui).
*   **Backend:** Supabase (PostgreSQL 15 + PostGIS), Edge Functions (Deno).
*   **Estado:** React Query (TanStack), Zustand.
*   **Seguridad:** RLS (Row Level Security) por Tenant, Zod Validation.

## 📦 Instalación y Despliegue

### Requisitos Previos
*   Node.js 18+
*   Cuenta de Supabase (con extensión PostGIS habilitada)

### Pasos de Instalación
1.  **Clonar repositorio**
    ```bash
    git clone https://github.com/tu-org/cellvi-2.0.git
    cd cellvi-2.0
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Copie `.env.example` a `.env` y configure sus credenciales:
    ```bash
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

4.  **Aplicar Migraciones de Base de Datos**
    Despliegue el esquema completo (incluyendo módulos Enterprise):
    ```bash
    supabase login
    supabase db push
    ```

5.  **Iniciar Servidor de Desarrollo**
    ```bash
    npm run dev
    ```

6.  **Construir para Producción**
    ```bash
    npm run build
    ```

## 🔐 Licencia y Propiedad
Este software es propiedad exclusiva. Prohibida su distribución no autorizada.
**CELLVI 2.0 Enterprise Certified.**
