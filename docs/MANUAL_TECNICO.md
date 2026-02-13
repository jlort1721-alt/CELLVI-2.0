# Manual Técnico - CELLVI 2.0

## 1. Arquitectura del Sistema

CELLVI 2.0 utiliza una arquitectura **Frontend-BaaS (Backend as a Service)**, delegando la infraestructura de base de datos y autenticación a Supabase, mientras el frontend (React/Vite) se encarga de la lógica de presentación y orquestación.

### 1.1 Diagrama de Alto Nivel
```mermaid
graph TD
    Client[Cliente Web / PWA] -->|HTTPS/REST| Supabase[Supabase API Gateway]
    Supabase -->|Auth| Auth[GoTrue Auth]
    Supabase -->|Data| DB[(PostgreSQL)]
    Supabase -->|Logic| Edge[Edge Functions (Deno)]
    
    subgraph "Módulos Frontend"
        Dashboard
        Preoperacional
        RNDC
        Mantenimiento
        Seguridad
    end
```

## 2. Modelo de Datos (PostgreSQL)

El esquema de base de datos está normalizado y protegido por RLS (Row Level Security) para garantizar multi-tenancy.

### 2.1 Tablas Principales
*   **`tenants`**: Organizaciones clientes.
*   **`vehicles`**: Parque automotor.
*   **`devices`**: Hardware GPS/IoT asociado.
*   **`alerts`**: Eventos críticos (Jamming, Geocercas).
*   **`trips`**: Viajes operativos.
*   **`pesv_inspections`**: Registros de checklist preoperacional.
*   **`work_orders`**: Órdenes de mantenimiento.
*   **`rndc_logs`**: Auditoría de envíos al Ministerio.

### 2.2 Seguridad (RLS)
Todas las tablas tienen políticas habilitadas que restringen el acceso:
```sql
CREATE POLICY "Tenant Isolation" ON table_name
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
```

## 3. Servicios y Lógica de Negocio

### 3.1 Integración RNDC (`src/features/compliance/rndc`)
*   **`xmlGenerator.ts`**: Construye el XML bajo el estándar del Ministerio de Transporte.
*   **`rndcService.ts`**: Simula el handshake SOAP y registra la transacción.

### 3.2 Servicio de Escalación (`supabase/functions/escalation-scheduler`)
Worker programado que busca alertas no atendidas (`status: open`) por más de 15 minutos y escala su prioridad o notifica supervisores.

## 4. Estructura del Código Frontend

Organizado por **Features** (Verticales de negocio) para escalabilidad:

```
src/
├── features/
│   ├── dashboard/       # Command Center
│   ├── preoperacional/  # App Móvil
│   ├── compliance/      # RNDC
│   ├── maintenance/     # Talleres
│   ├── security/        # Torre de Control
│   └── reports/         # BI
├── hooks/               # Hooks globales (useFleetData)
├── components/          # UI Kit (Shadcn)
└── integrations/        # Clientes externos (Supabase)
```
